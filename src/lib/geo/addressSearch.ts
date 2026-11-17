/**
 * 地址联想。
 * 现在用示例数据（大多伦多的一些路口）；M3 接入 Google Places（通过 Supabase Edge Function 调用，
 * 服务端 key 不进前端）后，这里换成真实查询，调用方式不变。
 */
export interface AddressResult {
  label: string;
  lat: number;
  lng: number;
}

export const ADDRESS_SEARCH_IS_MOCK = true;

// 示例地址只用路口，不用门牌号。北约克中心、万锦 Unionville 两个示例社区范围内外都有，方便测试。
const SAMPLE_ADDRESSES: readonly AddressResult[] = [
  { label: "Yonge St & Park Home Ave, North York", lat: 43.769, lng: -79.4136 },
  { label: "Yonge St & Sheppard Ave, North York", lat: 43.7615, lng: -79.411 },
  { label: "Yonge St & Finch Ave, North York", lat: 43.7746, lng: -79.414 },
  { label: "Doris Ave & Byng Ave, North York", lat: 43.773, lng: -79.4105 },
  { label: "Bayview Ave & Sheppard Ave, North York", lat: 43.7685, lng: -79.387 },
  { label: "Bathurst St & Steeles Ave, North York", lat: 43.7965, lng: -79.4455 },
  { label: "Main St Unionville & Hwy 7, Markham", lat: 43.86, lng: -79.314 },
  { label: "Main St Unionville & Carlton Rd, Markham", lat: 43.87, lng: -79.32 },
  { label: "Kennedy Rd & 16th Ave, Markham", lat: 43.88, lng: -79.295 },
  { label: "Spadina Ave & College St, Toronto", lat: 43.658, lng: -79.4 },
  { label: "Bloor St W & Bathurst St, Toronto", lat: 43.6655, lng: -79.411 },
  { label: "Warden Ave & Ellesmere Rd, Scarborough", lat: 43.7713, lng: -79.303 },
];

/** 按关键词查地址：忽略大小写、多个空格和 “&/and/和” 的写法差别 */
export async function searchAddresses(query: string): Promise<AddressResult[]> {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  return SAMPLE_ADDRESSES.filter((address) => {
    const haystack = normalize(address.label);
    return words.every((word) => haystack.includes(word));
  }).slice(0, 6);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[&,]|\band\b|和/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
