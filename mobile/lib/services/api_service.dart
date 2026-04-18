import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Change this to your production Railway URL before building APK
  static const String baseUrl = 'http://localhost:4000/api';

  static Future<Map<String, String>> _headers(String? token) async {
    final headers = {'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  static Future<dynamic> get(String path, {String? token}) async {
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: await _headers(token));
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body, {String? token}) async {
    final res = await http.post(Uri.parse('$baseUrl$path'), headers: await _headers(token), body: jsonEncode(body));
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body, {String? token}) async {
    final res = await http.put(Uri.parse('$baseUrl$path'), headers: await _headers(token), body: jsonEncode(body));
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> patch(String path, {Map<String, dynamic>? body, String? token}) async {
    final res = await http.patch(Uri.parse('$baseUrl$path'), headers: await _headers(token), body: body != null ? jsonEncode(body) : null);
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> uploadFile(String path, List<int> bytes, String filename, {String? token}) async {
    final uri = Uri.parse('$baseUrl$path');
    final req = http.MultipartRequest('POST', uri);
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    req.files.add(http.MultipartFile.fromBytes('image', bytes, filename: filename));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> delete(String path, {String? token}) async {
    final res = await http.delete(Uri.parse('$baseUrl$path'), headers: await _headers(token));
    _checkStatus(res);
    return jsonDecode(res.body);
  }

  static void _checkStatus(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final body = jsonDecode(res.body);
      throw ApiException(body['message'] ?? 'Request failed (${res.statusCode})');
    }
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}
