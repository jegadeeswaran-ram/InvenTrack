import '../config/app_config.dart';
import '../models/sale_model.dart';
import 'api_service.dart';

class SalesService {
  static const String _base = '${AppConfig.baseUrl}/sales';

  static Future<List<Map<String, dynamic>>> getLiveStock(int sessionId) async {
    final res = await ApiService.get('$_base/live-stock/$sessionId');
    final list = res['data'] as List? ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  static Future<SaleRecord> recordTruckSale({
    required int sessionId,
    required List<Map<String, dynamic>> items,
  }) async {
    final res = await ApiService.post('$_base/truck', {
      'sessionId': sessionId,
      'items': items,
    });
    return SaleRecord.fromJson(res['data']);
  }

  static Future<List<SaleRecord>> getHistory({String? saleType, String? dateFrom, String? dateTo}) async {
    final params = <String>[];
    if (saleType != null) params.add('saleType=$saleType');
    if (dateFrom != null) params.add('dateFrom=$dateFrom');
    if (dateTo   != null) params.add('dateTo=$dateTo');
    final query = params.isNotEmpty ? '?${params.join('&')}' : '';
    final res = await ApiService.get('$_base/history$query');
    final list = res['data'] as List? ?? [];
    return list.map((j) => SaleRecord.fromJson(j)).toList();
  }
}
