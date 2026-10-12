export function validationMessage(input) {
  const validity = input.validity
  if (validity.valueMissing) return 'Vui lòng điền hoặc chọn thông tin này.'
  if (validity.typeMismatch && input.type === 'email') return 'Vui lòng nhập địa chỉ email hợp lệ.'
  if (validity.typeMismatch) return 'Thông tin chưa đúng định dạng. Vui lòng kiểm tra lại.'
  if (validity.tooShort) return 'Vui lòng nhập ít nhất ' + input.minLength + ' ký tự.'
  if (validity.tooLong) return 'Vui lòng nhập tối đa ' + input.maxLength + ' ký tự.'
  if (validity.rangeUnderflow) return 'Giá trị phải từ ' + input.min + ' trở lên.'
  if (validity.rangeOverflow) return 'Giá trị phải không lớn hơn ' + input.max + '.'
  if (validity.badInput || validity.stepMismatch) return 'Vui lòng nhập một giá trị hợp lệ.'
  if (validity.patternMismatch) return 'Thông tin chưa đúng định dạng yêu cầu.'
  return 'Vui lòng kiểm tra lại thông tin này.'
}

export function showValidation(event) {
  if (event.target.setCustomValidity) event.target.setCustomValidity(validationMessage(event.target))
}

export function clearValidation(event) {
  event.target.setCustomValidity?.('')
}
