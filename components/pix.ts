function normalizePixText(value: string, maxLength: number) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim().toUpperCase().slice(0, maxLength);
}

function crc16(value: string) {
  let crc = 0xFFFF;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildPixPayload(key: string, companyName: string, amountCents?: number) {
  const merchantName = normalizePixText(companyName, 25) || 'UMARKET';
  const merchantCity = 'BRASIL';
  const merchantAccount = `0014BR.GOV.BCB.PIX01${String(key.length).padStart(2, '0')}${key}`;
  const amount = amountCents && amountCents > 0 ? `54${(amountCents / 100).toFixed(2).length.toString().padStart(2, '0')}${(amountCents / 100).toFixed(2)}` : '';
  const payloadWithoutCrc = `00020126${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}520400005303986${amount}5802BR59${String(merchantName.length).padStart(2, '0')}${merchantName}60${String(merchantCity.length).padStart(2, '0')}${merchantCity}62070503***6304`;
  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
}
