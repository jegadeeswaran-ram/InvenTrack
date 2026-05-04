import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class ApiService {
  static const _storage = FlutterSecureStorage();
  static const _keyAccess  = 'access_token';
  static const _keyRefresh = 'refresh_token';

  static Future<Map<String, String>> _headers({bool requiresAuth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    if (requiresAuth) {
      final token = await _storage.read(key: _keyAccess);
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<bool> _tryRefresh() async {
    try {
      final refresh = await _storage.read(key: _keyRefresh);
      if (refresh == null) return false;
      final res = await http.post(
        Uri.parse('${AppConfig.baseUrl}/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refresh}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        await _storage.write(key: _keyAccess,  value: data['accessToken']);
        await _storage.write(key: _keyRefresh, value: data['refreshToken']);
        return true;
      }
    } catch (_) {}
    return false;
  }

  static Future<dynamic> get(String url, {bool requiresAuth = true}) async {
    var res = await http.get(Uri.parse(url), headers: await _headers(requiresAuth: requiresAuth));
    if (res.statusCode == 401 && requiresAuth && await _tryRefresh()) {
      res = await http.get(Uri.parse(url), headers: await _headers(requiresAuth: requiresAuth));
    }
    _check(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> post(String url, Map<String, dynamic> body, {bool requiresAuth = true}) async {
    var res = await http.post(
      Uri.parse(url),
      headers: await _headers(requiresAuth: requiresAuth),
      body: jsonEncode(body),
    );
    if (res.statusCode == 401 && requiresAuth && await _tryRefresh()) {
      res = await http.post(
        Uri.parse(url),
        headers: await _headers(requiresAuth: requiresAuth),
        body: jsonEncode(body),
      );
    }
    _check(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> put(String url, Map<String, dynamic> body, {bool requiresAuth = true}) async {
    var res = await http.put(
      Uri.parse(url),
      headers: await _headers(requiresAuth: requiresAuth),
      body: jsonEncode(body),
    );
    if (res.statusCode == 401 && requiresAuth && await _tryRefresh()) {
      res = await http.put(
        Uri.parse(url),
        headers: await _headers(requiresAuth: requiresAuth),
        body: jsonEncode(body),
      );
    }
    _check(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> patch(String url, {Map<String, dynamic>? body, bool requiresAuth = true}) async {
    var res = await http.patch(
      Uri.parse(url),
      headers: await _headers(requiresAuth: requiresAuth),
      body: body != null ? jsonEncode(body) : null,
    );
    if (res.statusCode == 401 && requiresAuth && await _tryRefresh()) {
      res = await http.patch(
        Uri.parse(url),
        headers: await _headers(requiresAuth: requiresAuth),
        body: body != null ? jsonEncode(body) : null,
      );
    }
    _check(res);
    return jsonDecode(res.body);
  }

  static Future<dynamic> delete(String url, {bool requiresAuth = true}) async {
    var res = await http.delete(Uri.parse(url), headers: await _headers(requiresAuth: requiresAuth));
    if (res.statusCode == 401 && requiresAuth && await _tryRefresh()) {
      res = await http.delete(Uri.parse(url), headers: await _headers(requiresAuth: requiresAuth));
    }
    _check(res);
    return jsonDecode(res.body);
  }

  static void _check(http.Response res) {
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
