// AI 응답 마크다운에서 구조화된 카드 UI(요약 칩, 추천 매물, 추천 대출 상품)를 추출하는 파서

export type ChipData = {
  label: string;
  value: string;
};

export type PropertyCard = {
  name: string;
  type?: string;
  fit?: string;
  location?: string;
  price?: string;
  dsr?: string;
  description?: string;
};

export type LoanCard = {
  name: string;
  bankInfo?: string;
  rate?: string;
  maxAmount?: string;
};

// 재무 요약/추천 매물/추천 대출처럼 전용 카드로 매핑되지 않는 일반 번호 섹션
// (예: "4. 종합 의견:", "5. 유의사항:")을 위한 범용 카드
export type SectionCard = {
  title: string;
  body: string;
};

export type ParsedAiResponse = {
  text: string;
  chips: ChipData[];
  properties: PropertyCard[];
  loans: LoanCard[];
  sections: SectionCard[];
};

const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

function isTableRow(line: string): boolean {
  return line.includes('|') && line.trim().length > 0;
}

// 셀 안의 마크다운 강조 표기(**, __, *, _, `)를 제거해 카드에 그대로 표시할 수 있게 함
function stripEmphasis(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

function splitRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell) => stripEmphasis(cell.trim()));
}

function findCol(headers: string[], patterns: RegExp[], exclude: number[] = []): number {
  for (let i = 0; i < headers.length; i++) {
    if (exclude.includes(i)) continue;
    if (patterns.some((p) => p.test(headers[i]))) return i;
  }
  return -1;
}

function classifyTable(headers: string[]): 'property' | 'loan' | 'unknown' {
  const joined = headers.join(' ');
  if (/상품명|대출\s*상품|이자율/.test(joined) && /금리|LTV|한도/i.test(joined)) {
    return 'loan';
  }
  if (/매물|단지|아파트|가격|보증금|면적|위치|지역|소재지/.test(joined)) {
    return 'property';
  }
  return 'unknown';
}

function combine(...parts: (string | undefined)[]): string | undefined {
  const filtered = parts.filter((p) => p && p.trim());
  return filtered.length ? filtered.join(' · ') : undefined;
}

function mapPropertyRow(headers: string[], row: string[]): PropertyCard {
  const nameIdx = findCol(headers, [/매물명/, /단지명/, /이름/, /매물/]);
  const priceIdx = findCol(headers, [/가격/, /보증금/, /매매가/, /전세가/, /임대료/]);
  const areaIdx = findCol(headers, [/면적/, /평형/]);
  const locationIdx = findCol(headers, [/위치/, /지역/, /소재지/, /주소/]);
  const typeIdx = findCol(headers, [/거래\s*유형/, /거래\s*타입/, /구분/, /유형/]);
  const dsrIdx = findCol(headers, [/dsr/i]);
  const fitIdx = findCol(headers, [/적합/, /추천\s*여부/]);
  const featureIdx = findCol(headers, [/특징/]);
  const reasonIdx = findCol(headers, [/추천\s*이유/, /이유/, /설명/, /비고/], [featureIdx]);

  const get = (idx: number) => (idx >= 0 ? row[idx] : undefined);

  return {
    name: get(nameIdx) || row[0] || '매물',
    type: get(typeIdx),
    fit: get(fitIdx),
    location: get(locationIdx),
    price: combine(get(priceIdx), get(areaIdx)),
    dsr: get(dsrIdx),
    description: combine(get(featureIdx), get(reasonIdx)),
  };
}

function mapLoanRow(headers: string[], row: string[]): LoanCard {
  const nameIdx = findCol(headers, [/상품명/, /대출\s*상품/, /상품/]);
  const bankIdx = findCol(headers, [/은행/, /금융사/, /취급기관/]);
  const rateTypeIdx = findCol(headers, [/금리\s*유형/, /금리\s*종류/]);
  const ltvIdx = findCol(headers, [/ltv/i]);
  const rateIdx = findCol(headers, [/금리/, /이자율/], [rateTypeIdx]);
  const maxIdx = findCol(headers, [/한도/, /최대/]);

  const get = (idx: number) => (idx >= 0 ? row[idx] : undefined);
  const ltvVal = get(ltvIdx);

  return {
    name: get(nameIdx) || row[0] || '대출 상품',
    bankInfo: combine(get(bankIdx), get(rateTypeIdx), ltvVal ? `LTV ${ltvVal}` : undefined),
    rate: get(rateIdx),
    maxAmount: get(maxIdx),
  };
}

// "1. 재무 요약:" 같은 섹션 제목과 그 아래 자산/부채/구매예산 등의 줄을 제거
// (해당 정보는 extractChips로 칩에 표시되므로 본문 텍스트에서는 중복 노출하지 않음)
const FINANCIAL_SUMMARY_HEADING_RE = /^\s*#{0,6}\s*(?:\*\*)?\s*\d*\s*[.)]?\s*재무\s*요약\s*(?:\*\*)?\s*:?\s*$/;
const SECTION_HEADING_RE = /^\s*#{0,6}\s*(?:\*\*)?\s*\d+\s*[.)]/;

function stripFinancialSummarySection(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (skipping) {
      if (line.trim() === '') {
        skipping = false;
        continue;
      }
      if (SECTION_HEADING_RE.test(line)) {
        skipping = false;
      } else {
        continue;
      }
    }

    if (FINANCIAL_SUMMARY_HEADING_RE.test(line)) {
      skipping = true;
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

function extractChips(markdown: string): ChipData[] {
  const chips: ChipData[] = [];

  const budgetMatch = markdown.match(/구매\s*예산[:\s]*([\d,]+)\s*만\s*원/);
  if (budgetMatch) {
    const manWon = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (manWon > 0) {
      const eok = (manWon / 10000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
      chips.push({ value: `${eok}억`, label: '구매예산' });
    }
  }

  const ltvMatch = markdown.match(/LTV[^\d]*(\d+(?:\.\d+)?)\s*%/i);
  if (ltvMatch) {
    chips.push({ value: `LTV ${ltvMatch[1]}%`, label: '대출한도' });
  }

  const dsrMatch = markdown.match(/DSR[^\d]*(\d+(?:\.\d+)?)\s*%/i);
  if (dsrMatch) {
    chips.push({ value: `DSR ${dsrMatch[1]}%`, label: '상환한도' });
  }

  return chips;
}

// 파이프(|) 마크다운 표를 추출해 매물/대출 카드로 변환
function extractTables(markdown: string): { text: string; properties: PropertyCard[]; loans: LoanCard[] } {
  const lines = markdown.split('\n');
  const outputLines: string[] = [];
  const properties: PropertyCard[] = [];
  const loans: LoanCard[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    if (isTableRow(line) && nextLine !== undefined && TABLE_SEPARATOR_RE.test(nextLine)) {
      const headers = splitRow(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j]) && !TABLE_SEPARATOR_RE.test(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }

      const kind = classifyTable(headers);
      if (kind === 'loan' && rows.length > 0) {
        loans.push(...rows.map((r) => mapLoanRow(headers, r)));
        i = j - 1;
        continue;
      }
      if (kind === 'property' && rows.length > 0) {
        properties.push(...rows.map((r) => mapPropertyRow(headers, r)));
        i = j - 1;
        continue;
      }
      // 데이터 행이 없는 표(헤더+구분선만)는 마크다운으로 그대로 출력하면
      // 빈 네이비색 헤더 바만 렌더링되어 혼란을 주므로 통째로 제거한다
      if (rows.length === 0) {
        i = j - 1;
        continue;
      }
      // 알 수 없는 형식의 표는 그대로 마크다운으로 출력
    }

    outputLines.push(line);
  }

  return { text: outputLines.join('\n'), properties, loans };
}

// "1. 재무 요약: * 소득:... * 자산:..." 처럼 줄바꿈 없이 글머리 기호(*)로 이어지는
// 번호 섹션 형식을 인식하기 위한 섹션 제목 패턴
type SectionKind = 'finance' | 'property' | 'loan' | 'summary';

const SECTION_TITLES: { re: RegExp; kind: SectionKind }[] = [
  { re: /재무\s*요약/, kind: 'finance' },
  { re: /추천\s*매물|매물\s*추천/, kind: 'property' },
  { re: /추천\s*대출(?:\s*상품)?|대출\s*추천|대출\s*상품/, kind: 'loan' },
  { re: /종합\s*의견|요약\s*의견|결론/, kind: 'summary' },
];

// "N. <제목>:" 형태의 모든 번호 섹션 경계를 찾는다 (제목 1~30자, 콜론으로 끝남).
// 제목의 첫 글자는 숫자가 아니어야 가격 표기("1.5억" 등)와의 오인식을 줄인다.
const GENERIC_SECTION_RE = /\d+\s*[.)]\s*(?:\*\*)?\s*([^\n:：*\d][^\n:：*]{0,29})\s*(?:\*\*)?\s*[:：]/g;

function classifySectionTitle(title: string): SectionKind | null {
  for (const s of SECTION_TITLES) {
    if (s.re.test(title)) return s.kind;
  }
  return null;
}

// "* 키:값* 키:값" 형태의 글머리 기호 나열에서 key-value 쌍을 추출.
// startKeyPatterns에 해당하는 키가 다시 나오면 새로운 그룹(매물/대출 1건)으로 취급.
const BULLET_KV_RE = /\*\s*([^*:：\n]{1,30})[:：]\s*([^*]*)/g;

function extractKvGroups(content: string, startKeyPatterns: RegExp[]): Record<string, string>[] {
  const groups: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const m of content.matchAll(BULLET_KV_RE)) {
    const key = m[1].trim();
    const value = stripEmphasis(m[2].trim());
    if (!key || !value) continue;

    const isStart = startKeyPatterns.some((p) => p.test(key));
    if (isStart || !current) {
      if (current) groups.push(current);
      current = {};
    }
    current[key] = value;
  }
  if (current) groups.push(current);

  return groups;
}

function pickKv(kv: Record<string, string>, patterns: RegExp[]): string | undefined {
  for (const key of Object.keys(kv)) {
    if (patterns.some((p) => p.test(key))) return kv[key];
  }
  return undefined;
}

function mapPropertyKv(kv: Record<string, string>): PropertyCard {
  return {
    name: pickKv(kv, [/매물명/, /단지명/]) || '매물',
    type: pickKv(kv, [/거래\s*유형/, /거래\s*타입/, /구분/]),
    fit: pickKv(kv, [/적합/, /추천\s*여부/]),
    location: pickKv(kv, [/위치/, /지역/, /소재지/, /주소/]),
    price: combine(pickKv(kv, [/가격/, /보증금/, /매매가/, /전세가/]), pickKv(kv, [/면적/, /평형/])),
    dsr: pickKv(kv, [/dsr/i]),
    description: combine(pickKv(kv, [/특징/]), pickKv(kv, [/추천\s*이유/])),
  };
}

function mapLoanKv(kv: Record<string, string>): LoanCard {
  const bank = pickKv(kv, [/은행/, /금융사/, /취급기관/]);
  const ltv = pickKv(kv, [/ltv/i]);
  let rate = pickKv(kv, [/^금리$/]) || pickKv(kv, [/금리/, /이자율/]);
  let rateType: string | undefined;

  // "4.61%~4.61%(고정금리)" → 금리 "4.61%~4.61%" + 금리유형 "고정금리"로 분리
  if (rate) {
    const m = rate.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (m) {
      rate = m[1].trim();
      rateType = m[2].trim();
    }
  }

  return {
    name: pickKv(kv, [/상품명/, /대출\s*상품/]) || '대출 상품',
    bankInfo: combine(bank, rateType, ltv ? `LTV ${ltv}` : undefined),
    rate,
    maxAmount: pickKv(kv, [/최대\s*한도/, /대출\s*한도/, /^한도$/, /월\s*상환액/, /최대/]),
  };
}

// "* 항목1* 항목2* 항목3" → "- 항목1\n- 항목2\n- 항목3" 마크다운 목록으로 정리
function reformatBullets(content: string): string {
  const items: string[] = [];
  for (const m of content.matchAll(/\*\s*([^*]+)/g)) {
    const text = stripEmphasis(m[1]);
    if (text) items.push(`- ${text}`);
  }
  return items.length > 0 ? items.join('\n') : content.trim();
}

// "N. 재무 요약:* 소득:...* 자산:..." 처럼 줄바꿈 없이 이어지는 번호 섹션을 찾아
// 재무 요약은 칩으로(텍스트에서 제거), 추천 매물/대출은 카드로 변환.
// 그 외 섹션(예: 종합 의견, 유의사항 등)은 제목+본문을 가진 범용 카드로 변환.
function extractBulletSections(markdown: string): {
  text: string;
  properties: PropertyCard[];
  loans: LoanCard[];
  sections: SectionCard[];
} {
  const matches = [...markdown.matchAll(GENERIC_SECTION_RE)];
  if (matches.length === 0) {
    return { text: markdown, properties: [], loans: [], sections: [] };
  }

  const properties: PropertyCard[] = [];
  const loans: LoanCard[] = [];
  const sections: SectionCard[] = [];
  const parts: string[] = [];

  const firstStart = matches[0].index ?? 0;
  if (firstStart > 0) {
    parts.push(markdown.slice(0, firstStart));
  }

  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    const matchStart = m.index ?? 0;
    const matchEnd = matchStart + m[0].length;
    const nextStart = idx + 1 < matches.length ? matches[idx + 1].index ?? markdown.length : markdown.length;
    const heading = m[0].trim();
    const title = m[1].trim();
    const content = markdown.slice(matchEnd, nextStart);
    const kind = classifySectionTitle(title);

    if (kind === 'finance') {
      // 구매예산/LTV/DSR은 extractChips가 칩으로 추출하므로 본문에서는 생략.
      // 글머리 기호(*) 형식이든 줄 단위(key: value) 형식이든 재무 정보면 생략하고,
      // 그 외 형식이면 원문 그대로(개행 포함) 보존해 stripFinancialSummarySection이 처리하도록 한다.
      if (
        /\*\s*[^*]*?(?:소득|자산|부채|예산|LTV|DSR)/i.test(content) ||
        /(?:소득|자산|부채|예산|LTV|DSR)\s*[:：]/i.test(content)
      ) {
        continue;
      }
      parts.push(`${heading}${content}`);
      continue;
    }

    if (kind === 'property') {
      const groups = extractKvGroups(content, [/매물명/, /단지명/]);
      if (groups.length > 0) {
        properties.push(...groups.map(mapPropertyKv));
        continue;
      }
      parts.push(`${heading}${content}`);
      continue;
    }

    if (kind === 'loan') {
      const groups = extractKvGroups(content, [/상품명/, /대출\s*상품/]);
      if (groups.length > 0) {
        loans.push(...groups.map(mapLoanKv));
        continue;
      }
      parts.push(`${heading}${content}`);
      continue;
    }

    // 'summary'(종합 의견 등) 또는 분류되지 않은 섹션: 글머리 기호를 줄 단위 목록으로
    // 정리해 제목+본문을 가진 범용 카드로 변환
    sections.push({ title, body: reformatBullets(content) });
  }

  return { text: parts.join('\n\n'), properties, loans, sections };
}

// "N. 추천 매물:" 처럼 표 형태의 본문이 카드로 모두 추출되고 제목만 덩그러니 남은
// 블록을 제거한다. (재무 요약/종합 의견 등은 별도 로직에서 이미 처리되므로
// 매물/대출 섹션 제목만 대상으로 함)
const ORPHAN_HEADING_RE = /^\d+\s*[.)]\s*(?:\*\*)?\s*([^\n:：*]{1,30})\s*(?:\*\*)?\s*[:：]$/;

function removeOrphanSectionHeadings(text: string): string {
  const blocks = text.split(/\n{2,}/);
  const filtered = blocks.filter((block) => {
    const m = block.trim().match(ORPHAN_HEADING_RE);
    if (!m) return true;
    const kind = classifySectionTitle(m[1].trim());
    return kind !== 'property' && kind !== 'loan';
  });
  return filtered.join('\n\n');
}

export function parseAiMarkdown(markdown: string): ParsedAiResponse {
  const chips = extractChips(markdown);

  const bulletResult = extractBulletSections(markdown);
  const stripped = stripFinancialSummarySection(bulletResult.text);
  const tableResult = extractTables(stripped);

  const text = removeOrphanSectionHeadings(tableResult.text).replace(/\n{3,}/g, '\n\n').trim();

  return {
    text,
    chips,
    properties: [...bulletResult.properties, ...tableResult.properties],
    loans: [...bulletResult.loans, ...tableResult.loans],
    sections: bulletResult.sections,
  };
}
