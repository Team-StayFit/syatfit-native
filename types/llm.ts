export interface LLMResponse {
  financial_summary: {
    budget: number;
    ltv: number;
    dsr: number;
  };
  properties: Array<{
    name: string;
    location: string;
    price: number;
    dsr: number;
    type: '매매' | '전세' | '오피스텔';
    suitable: boolean;
  }>;
  loans: Array<{
    name: string;
    bank: string;
    rate: string;
    ltv_limit: number;
    max_amount: number;
    type: '변동금리' | '고정금리';
  }>;
  reason: string;
}
