import 'api_service.dart';

class TruckService {
  static Future<Map<String, dynamic>?> getMySession(String token) async {
    final data = await ApiService.get('/truck-sessions/my-session', token: token);
    return data as Map<String, dynamic>?;
  }

  static Future<Map<String, dynamic>> startSession({
    required String token,
    required int truckId,
    required List<Map<String, dynamic>> dispatches,
    String? notes,
  }) async {
    return await ApiService.post('/truck-sessions/start', {
      'truckId': truckId,
      'dispatches': dispatches,
      if (notes != null) 'notes': notes,
    }, token: token);
  }

  static Future<Map<String, dynamic>> recordSale({
    required String token,
    required int sessionId,
    required int productId,
    required double quantity,
    required double pricePerUnit,
    String? notes,
  }) async {
    return await ApiService.post('/truck-sessions/$sessionId/sale', {
      'productId': productId,
      'quantity': quantity,
      'pricePerUnit': pricePerUnit,
      if (notes != null) 'notes': notes,
    }, token: token);
  }

  static Future<Map<String, dynamic>> closeSession({
    required String token,
    required int sessionId,
    required List<Map<String, dynamic>> returns,
    String? notes,
  }) async {
    return await ApiService.put('/truck-sessions/$sessionId/close', {
      'returns': returns,
      if (notes != null) 'notes': notes,
    }, token: token);
  }

  static Future<List<dynamic>> getProducts(String token) async {
    return await ApiService.get('/products', token: token);
  }

  static Future<List<dynamic>> getTrucks(String token) async {
    return await ApiService.get('/trucks', token: token);
  }
}
