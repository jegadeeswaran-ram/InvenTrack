class ClosingStockItem {
  final int productId;
  final String productName;
  final int systemRemaining;
  int enteredReturnQty;

  ClosingStockItem({
    required this.productId,
    required this.productName,
    required this.systemRemaining,
    required this.enteredReturnQty,
  });

  factory ClosingStockItem.fromDispatch(Map<String, dynamic> j) {
    final loaded = j['loadedQty'] as int? ?? 0;
    final sold   = j['soldQty']   as int? ?? 0;
    final returned = j['returnedQty'] as int? ?? 0;
    return ClosingStockItem(
      productId: j['productId'],
      productName: j['product']?['name'] ?? '',
      systemRemaining: loaded - sold - returned,
      enteredReturnQty: loaded - sold - returned,
    );
  }
}

class ClosingRecord {
  final int id;
  final String status;
  final DateTime submittedAt;

  const ClosingRecord({
    required this.id,
    required this.status,
    required this.submittedAt,
  });

  factory ClosingRecord.fromJson(Map<String, dynamic> j) => ClosingRecord(
        id: j['id'],
        status: j['status'] ?? 'PENDING',
        submittedAt: DateTime.tryParse(j['submittedAt'] ?? '') ?? DateTime.now(),
      );
}
