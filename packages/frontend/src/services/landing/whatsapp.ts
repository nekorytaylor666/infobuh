export function getWhatsappLink() {
  const text = 'Здравствуйте, хочу узнать подробнее'
  const url = `https://wa.me/7079201320?text=${encodeURIComponent(text)}`
  window.open(url, "_blank");
}
