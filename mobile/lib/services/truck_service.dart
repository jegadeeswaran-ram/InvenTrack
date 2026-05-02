import 'api_service.dart';

class TruckService {
  // ── Branches & Trucks ────────────────────────────────────────────────────

  static Future<List<dynamic>> getBranches(String token) async {
    return List<dynamic>.from(await ApiService.get('/truck/branches', token: token));
  }

  static Future<List<dynamic>> getTrucks(String token, {int? branchId}) async {
    final path = branchId != null ? '/truck/trucks?branchId=$branchId' : '/truck/trucks';
    return List<dynamic>.from(await ApiService.get(path, token: token));
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> startDay(
      String token, int truckId, int branchId) async {
    return Map<String, dynamic>.from(await ApiService.post(
      '/truck/sessions/start',
      {'truckId': truckId, 'branchId': branchId},
      token: token,
    ));
  }

  static Future<Map<String, dynamic>?> getTodaySession(String token) async {
    final data = await ApiService.get('/truck/sessions/today', token: token);
    final raw = data['session'];
    if (raw == null) return null;
    return Map<String, dynamic>.from(raw);
  }

  static Future<Map<String, dynamic>> getSessionById(
      String token, int sessionId) async {
    return Map<String, dynamic>.from(
        await ApiService.get('/truck/sessions/$sessionId', token: token));
  }

  static Future<Map<String, dynamic>> closeDay(
      String token, int sessionId, List<Map<String, dynamic>> closingStocks) async {
    return Map<String, dynamic>.from(await ApiService.post(
      '/truck/sessions/$sessionId/close',
      {'closingStocks': closingStocks},
      token: token,
    ));
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  static Future<List<dynamic>> getSales(String token, int sessionId) async {
    return List<dynamic>.from(
        await ApiService.get('/truck/sessions/$sessionId/sales', token: token));
  }

  static Future<Map<String, dynamic>> createSale(
      String token, int sessionId, List<Map<String, dynamic>> items) async {
    return Map<String, dynamic>.from(await ApiService.post(
      '/truck/sales',
      {'sessionId': sessionId, 'items': items},
      token: token,
    ));
  }

  static Future<void> deleteSale(String token, int saleId) async {
    await ApiService.delete('/truck/sales/$saleId', token: token);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> getSessionReport(
      String token, int sessionId) async {
    return Map<String, dynamic>.from(
        await ApiService.get('/truck/reports/session/$sessionId', token: token));
  }

  // ── Products (reuse existing endpoint) ───────────────────────────────────

  static Future<List<dynamic>> getProducts(String token) async {
    return List<dynamic>.from(await ApiService.get('/products', token: token));
  }
}
