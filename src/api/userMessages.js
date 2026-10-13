const messages = {
  LOGIN_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  UNAUTHORIZED: 'Bạn không có quyền thực hiện thao tác này.',
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  ACCOUNT_EXISTS: 'Tên đăng nhập hoặc email đã được sử dụng.',
  INVALID_REGISTRATION: 'Kiểm tra tên, email và mật khẩu ít nhất 8 ký tự.',
  CSRF_INVALID: 'Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang.',
  INVALID_2FA_CODE: 'Mã xác thực 2 lớp (OTP) không chính xác hoặc đã hết hạn.',
  TWO_FACTOR_ALREADY_ENABLED: 'Tài khoản của bạn đã kích hoạt xác thực 2 lớp.',
  TWO_FACTOR_SETUP_REQUIRED: 'Vui lòng thiết lập lại mã xác thực 2 lớp.',
  CHALLENGE_EXPIRED: 'Phiên đăng nhập 2 lớp đã hết hạn. Vui lòng thử lại.',
  CUSTOMER_NOT_FOUND: 'Không tìm thấy tài khoản.',
  INVALID_VOUCHER: 'Mã giảm giá không còn hiệu lực hoặc không áp dụng cho đơn hàng này.',
  VOUCHER_NOT_FOUND: 'Không tìm thấy mã giảm giá.',
  VOUCHER_CODE_EXHAUSTED: 'Chưa thể cấp mã giảm giá. Vui lòng thử lại sau.',
  PRODUCT_UNAVAILABLE: 'Sản phẩm đã hết hàng hoặc không còn đủ số lượng.',
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm.',
  INVALID_DELIVERY_REGION: 'Vui lòng chọn địa chỉ và khoảng cách giao hàng hợp lệ.',
  INVALID_ORDER: 'Thông tin đơn hàng chưa hợp lệ. Vui lòng kiểm tra lại.',
  INVALID_REVIEW: 'Vui lòng chọn từ 1 đến 5 sao và viết nhận xét tối đa 2.000 ký tự.',
  INVALID_REPLY: 'Nội dung trả lời phải có từ 1 đến 2.000 ký tự.',
  REVIEW_NOT_FOUND: 'Không tìm thấy đánh giá.',
  INVALID_WHEEL: 'Vòng quay đã chọn không hợp lệ. Vui lòng chọn lại.',
  NO_SPIN_CREDITS: 'Bạn chưa có lượt quay. Mỗi 100.000 đ tiền hàng đã thanh toán nhận một lượt.',
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng.',
  PAYMENT_SESSION_NOT_FOUND: 'Không tìm thấy phiên thanh toán. Vui lòng mở lại mã QR.',
  PAYMENT_SESSION_CANCELLED: 'Bạn đã thoát phiên thanh toán. Vui lòng mở lại mã QR nếu cần.',
  PAYMENT_SESSION_EXPIRED: 'Đã hết 2 phút thanh toán. Vui lòng kiểm tra thông tin và mở lại mã QR.',
  CASE_NOT_FOUND: 'Không tìm thấy yêu cầu hỗ trợ đơn hàng.',
  INVALID_SCHEDULE: 'Vui lòng chọn thời gian giao hoặc nhận hàng hợp lệ trong tương lai.',
  QUOTE_CHANGED: 'Giá đơn hàng đã thay đổi. Vui lòng kiểm tra lại tổng tiền.',
  PAYMENT_REQUIRED: 'Đơn hàng cần được xác nhận thanh toán trước.',
  PAYMENT_REFERENCE_REQUIRED: 'Vui lòng nhập mã giao dịch đã được đối soát.',
  ACTION_NOT_ALLOWED: 'Trạng thái hiện tại không cho phép thao tác này.',
  DEMO_ONLY: 'Chức năng này chỉ dành cho thanh toán mô phỏng.',
  ONLINE_PAYMENT_REQUIRED: 'Đơn thanh toán trực tiếp cần được xử lý tại cửa hàng.',
  RETURN_WINDOW_EXPIRED: 'Đã quá thời hạn gửi yêu cầu trả hàng 7 ngày.',
  DELIVERY_REQUIRED: 'Bạn chỉ có thể yêu cầu trả hàng sau khi nhận hàng.',
  ALREADY_SHIPPED: 'Đơn hàng đã được chuyển giao nên không thể hủy theo diện chưa giao.',
  CASE_ALREADY_OPEN: 'Đơn hàng đang có một yêu cầu cần xử lý.',
  RESCHEDULE_WINDOW_EXPIRED: 'Lịch mới phải trong vòng 7 ngày kể từ lịch hẹn cũ.',
  INVALID_REASON: 'Vui lòng nhập lý do từ 5 đến 1.000 ký tự.',
  RETURN_NOT_RECEIVED: 'Cần xác nhận đã nhận lại hàng trước khi hoàn tiền.',
  REFUND_REFERENCE_REQUIRED: 'Cần xác nhận chuyển tiền hoàn và nhập mã giao dịch.',
  CASE_PENDING: 'Đơn hàng đang có yêu cầu sau bán hàng cần xử lý.',
  COUNTER_CONFIRMATION_REQUIRED: 'Cần xác nhận đã thu tiền trực tiếp tại quầy.',
  DELIVERY_PAYMENT_CONFIRMATION_REQUIRED: 'Cần xác nhận đã thu tiền khi giao hàng.',
  INVALID_PAYMENT_SETTINGS: 'Thông tin thanh toán chưa hợp lệ. Vui lòng liên hệ cửa hàng.',
  WEBHOOK_NOT_CONFIGURED: 'Dịch vụ xác nhận thanh toán chưa sẵn sàng. Vui lòng liên hệ cửa hàng.',
  INVALID_PAYMENT_AMOUNT: 'Số tiền thanh toán chưa hợp lệ.',
  INVALID_CONTACT: 'Vui lòng kiểm tra tên, email và nội dung từ 10 đến 2.000 ký tự.',
  BAD_REQUEST: 'Thông tin gửi đi chưa hợp lệ. Vui lòng kiểm tra lại.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.',
  IDEMPOTENCY_CONFLICT: 'Yêu cầu này đã được sử dụng. Vui lòng gửi một tin nhắn mới.',
  TURN_IN_PROGRESS: 'Tin nhắn trước vẫn đang được xử lý. Vui lòng chờ.',
  RETRY_SUPERSEDED: 'Đã có lượt trò chuyện mới hơn. Vui lòng gửi lại bằng tin nhắn mới.',
  CONVERSATION_NOT_FOUND: 'Không tìm thấy cuộc trò chuyện. Vui lòng mở cuộc trò chuyện mới.',
  CONVERSATION_BUSY: 'Cuộc trò chuyện đang được xử lý. Vui lòng chờ một lát.',
  QUEUE_FULL: 'Trợ lý đang bận. Vui lòng thử lại sau ít phút.',
  QUEUE_TIMEOUT: 'Thời gian chờ trợ lý đã hết. Vui lòng thử lại.',
  MODEL_NOT_FOUND: 'Trợ lý chưa sẵn sàng. Vui lòng thử lại sau.',
  OLLAMA_TIMEOUT: 'Trợ lý phản hồi quá chậm. Vui lòng thử lại.',
  OLLAMA_EARLY_EOF: 'Kết nối bị ngắt trước khi trả lời xong. Vui lòng thử lại.',
  OUTPUT_LIMIT: 'Câu trả lời quá dài và chưa hoàn tất. Vui lòng đặt câu hỏi ngắn hơn.',
  OLLAMA_INCOMPLETE: 'Câu trả lời chưa hoàn tất. Vui lòng thử lại.',
  CONTEXT_TOO_LARGE: 'Cuộc trò chuyện quá dài. Vui lòng mở cuộc trò chuyện mới.',
  AI_UNAVAILABLE: 'Chưa thể nhận câu trả lời từ trợ lý. Vui lòng thử lại sau.',
  BAD_STREAM_EVENT: 'Dữ liệu trả lời không hợp lệ. Vui lòng thử lại.',
  BAD_STREAM: 'Dữ liệu trả lời bị lỗi. Vui lòng thử lại.',
  NO_STREAM: 'Không nhận được câu trả lời. Vui lòng thử lại.',
  INCOMPLETE_STREAM: 'Kết nối bị ngắt trước khi trả lời xong. Vui lòng thử lại.',
  NOT_FOUND: 'Không tìm thấy nội dung được yêu cầu.',
  REQUEST_TOO_LARGE: 'Nội dung gửi đi quá lớn. Vui lòng rút ngắn rồi thử lại.',
  INVALID_JSON: 'Dữ liệu gửi đi chưa hợp lệ. Vui lòng tải lại trang rồi thử lại.',
  INVALID_RESPONSE: 'Dữ liệu phản hồi chưa hợp lệ. Vui lòng thử lại.',
  INTERNAL_ERROR: 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.',
  NETWORK_ERROR: 'Không thể kết nối đến cửa hàng. Vui lòng kiểm tra mạng rồi thử lại.',
  TIMEOUT: 'Yêu cầu đã quá thời gian chờ. Vui lòng thử lại.',
  ABORTED: 'Yêu cầu đã được hủy.',
}

const fallbackMessage = 'Không thể hoàn tất thao tác.'

function knownMessage(code) {
  return typeof code === 'string' && Object.hasOwn(messages, code) ? messages[code] : ''
}

export function apiErrorMessage(payload = {}, status = 0) {
  const known = knownMessage(payload?.error) || knownMessage(payload?.code)
  if (known) return known
  // Chỉ dùng bảng dịch; thông báo máy chủ có thể chứa tiếng Anh hoặc chi tiết nội bộ.
  if (status === 401) return messages.UNAUTHENTICATED
  if (status === 403) return messages.UNAUTHORIZED
  if (status === 404) return messages.NOT_FOUND
  if (status === 408 || status === 504) return messages.TIMEOUT
  if (status === 413) return messages.REQUEST_TOO_LARGE
  if (status === 429) return messages.RATE_LIMITED
  if (status >= 500) return messages.INTERNAL_ERROR
  if (status >= 400) return messages.BAD_REQUEST
  return fallbackMessage
}

function isVietnameseMessage(value) {
  return typeof value === 'string'
    && /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(value)
    && !/[A-Z]{2,}_[A-Z_]+|\b(?:Error|TypeError|SyntaxError|HTTP|fetch|JSON|undefined|stack)\b|https?:\/\//.test(value)
}

export function userMessage(error, fallback = fallbackMessage) {
  const message = typeof error === 'string' ? error : error?.message
  const known = knownMessage(error?.code) || knownMessage(message)
  if (known) return known
  if (error?.name === 'AbortError') return messages.ABORTED
  if (error?.name === 'TimeoutError' || /timeout|timed out/i.test(message || '')) return messages.TIMEOUT
  if (/fetch|network|load failed|connection|ECONN|ENOTFOUND/i.test(message || '')) return messages.NETWORK_ERROR
  if (error?.name === 'SyntaxError' || /JSON|unexpected token|unexpected end/i.test(message || '')) {
    return messages.INVALID_RESPONSE
  }
  if (isVietnameseMessage(message)) return message.trim()
  return isVietnameseMessage(fallback) ? fallback.trim() : fallbackMessage
}
