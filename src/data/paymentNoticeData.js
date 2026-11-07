export function paymentNotifications(orders = []) {
  return orders.flatMap(order => {
    const notifications = []
    if (order.paymentReportedAt) notifications.push({
      id: order.id + '-reported',
      orderId: order.id,
      createdAt: order.paymentReportedAt,
      title: 'Đã gửi thông báo chuyển khoản',
      message: 'Mã giao dịch đã được lưu. Cửa hàng sẽ đối soát và cập nhật trạng thái thanh toán.',
    })
    if (order.paidAt) notifications.push({
      id: order.id + '-paid',
      orderId: order.id,
      createdAt: order.paidAt,
      title: 'Đã xác nhận thanh toán',
      message: 'Thanh toán của đơn hàng đã được ghi nhận trong tài khoản của bạn.',
    })
    return notifications
  }).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
}
