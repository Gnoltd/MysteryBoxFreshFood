export interface VNBank {
  name: string
  bin: string
}

export const VIETNAMESE_BANKS: VNBank[] = [
  { name: 'Vietcombank (VCB)', bin: '970436' },
  { name: 'BIDV', bin: '970418' },
  { name: 'Vietinbank', bin: '970415' },
  { name: 'Agribank', bin: '970405' },
  { name: 'MBBank', bin: '970422' },
  { name: 'Techcombank (TCB)', bin: '970407' },
  { name: 'ACB', bin: '970416' },
  { name: 'VPBank', bin: '970432' },
  { name: 'Sacombank', bin: '970403' },
  { name: 'HDBank', bin: '970437' },
  { name: 'TPBank', bin: '970423' },
  { name: 'VIB', bin: '970441' },
  { name: 'OCB', bin: '970448' },
  { name: 'SHB', bin: '970443' },
  { name: 'MSB', bin: '970426' },
  { name: 'Eximbank', bin: '970431' },
  { name: 'SeABank', bin: '970440' },
  { name: 'Nam A Bank', bin: '970428' },
  { name: 'Kienlongbank', bin: '970452' },
  { name: 'BaoViet Bank', bin: '970438' },
]

export function vietQRUrl(
  bin: string,
  account: string,
  amount: number,
  description: string,
  accountName?: string
): string {
  const params = new URLSearchParams({ amount: String(amount), addInfo: description })
  if (accountName) params.set('accountName', accountName)
  return `https://img.vietqr.io/image/${bin}-${account}-compact2.png?${params.toString()}`
}
