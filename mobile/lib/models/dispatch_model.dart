class DispatchItem {
  final int productId;
  final String productName;
  final String sku;
  final int loadedQty;
  final int soldQty;
  final int returnedQty;
  final double unitPrice;

  const DispatchItem({
    required this.productId,
    required this.productName,
    required this.sku,
    required this.loadedQty,
    required this.soldQty,
    required this.returnedQty,
    required this.unitPrice,
  });

  int get remaining => loadedQty - soldQty - returnedQty;

  factory DispatchItem.fromJson(Map<String, dynamic> j) => DispatchItem(
        productId: j['productId'],
        productName: j['product']?['name'] ?? '',
        sku: j['product']?['sku'] ?? '',
        loadedQty: j['loadedQty'] ?? 0,
        soldQty: j['soldQty'] ?? 0,
        returnedQty: j['returnedQty'] ?? 0,
        unitPrice: double.tryParse(j['unitPrice']?.toString() ?? '0') ?? 0,
      );
}

class DispatchSession {
  final int id;
  final String status;
  final String date;
  final String? truckId;
  final List<DispatchItem> items;

  const DispatchSession({
    required this.id,
    required this.status,
    required this.date,
    this.truckId,
    required this.items,
  });

  factory DispatchSession.fromJson(Map<String, dynamic> j) => DispatchSession(
        id: j['id'],
        status: j['status'] ?? 'ACTIVE',
        date: j['date'] ?? '',
        truckId: j['truckId'],
        items: (j['dispatches'] as List? ?? [])
            .map((d) => DispatchItem.fromJson(d))
            .toList(),
      );
}
