export function setOverScroll(value: boolean) {
  document.getElementsByTagName('html')[0].style.overscrollBehavior = value ? 'auto' : 'none'
}
