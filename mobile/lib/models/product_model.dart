class ProductModel {
  final int id;
  final String name;
  final String category;
  final String sku;
  final double price;
  final String unit;
  final String? imageUrl;

  const ProductModel({
    required this.id,
    required this.name,
    required this.category,
    required this.sku,
    required this.price,
    required this.unit,
    this.imageUrl,
  });

  factory ProductModel.fromJson(Map<String, dynamic> j) => ProductModel(
        id: j['id'],
        name: j['name'],
        category: j['category'] ?? '',
        sku: j['sku'] ?? '',
        price: double.tryParse(j['price'].toString()) ?? 0,
        unit: j['unit'] ?? 'PCS',
        imageUrl: j['imageUrl'],
      );
}
