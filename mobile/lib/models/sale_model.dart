class SaleItem {
  final int productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double total;

  const SaleItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.total,
  });

  factory SaleItem.fromJson(Map<String, dynamic> j) => SaleItem(
        productId: j['productId'],
        productName: j['product']?['name'] ?? '',
        quantity: j['quantity'],
        unitPrice: double.tryParse(j['unitPrice'].toString()) ?? 0,
        total: double.tryParse(j['total'].toString()) ?? 0,
      );
}

class SaleRecord {
  final int id;
  final String saleType;
  final double totalAmount;
  final DateTime createdAt;
  final List<SaleItem> items;

  const SaleRecord({
    required this.id,
    required this.saleType,
    required this.totalAmount,
    required this.createdAt,
    required this.items,
  });

  factory SaleRecord.fromJson(Map<String, dynamic> j) => SaleRecord(
        id: j['id'],
        saleType: j['saleType'] ?? 'TRUCK',
        totalAmount: double.tryParse(j['totalAmount'].toString()) ?? 0,
        createdAt: DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
        items: (j['items'] as List? ?? []).map((i) => SaleItem.fromJson(i)).toList(),
      );
}

class CartEntry {
  final int productId;
  final String productName;
  final int available;
  int quantity;
  final double unitPrice;

  CartEntry({
    required this.productId,
    required this.productName,
    required this.available,
    required this.quantity,
    required this.unitPrice,
  });

  double get total => quantity * unitPrice;
}
