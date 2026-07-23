export function whatsappLink(numero: string) {
  const digits = numero.replace(/\D/g, "");
  const comPais = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${comPais}`;
}

export function mailtoLink(email: string) {
  return `mailto:${email}`;
}
