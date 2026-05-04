import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _keyAccess  = 'access_token';
  static const _keyRefresh = 'refresh_token';
  static const _keyUser    = 'user_json';

  static Future<Map<String, dynamic>> login(String loginId, String password) async {
    final res = await ApiService.post(
      '${AppConfig.baseUrl}/auth/login',
      {'login': loginId, 'password': password},
      requiresAuth: false,
    );
    final data = res['data'] as Map<String, dynamic>;
    await _storage.write(key: _keyAccess,  value: data['accessToken']);
    await _storage.write(key: _keyRefresh, value: data['refreshToken']);
    await _storage.write(key: _keyUser, value: jsonEncode(data['user']));
    return data;
  }

  static Future<void> logout() async {
    try {
      final refresh = await _storage.read(key: _keyRefresh);
      if (refresh != null) {
        await ApiService.post(
          '${AppConfig.baseUrl}/auth/logout',
          {'refreshToken': refresh},
          requiresAuth: false,
        );
      }
    } catch (_) {}
    await _storage.deleteAll();
  }

  static Future<String?> getAccessToken() => _storage.read(key: _keyAccess);
  static Future<String?> getRefreshToken() => _storage.read(key: _keyRefresh);

  static Future<UserModel?> getSavedUser() async {
    final raw = await _storage.read(key: _keyUser);
    if (raw == null) return null;
    return UserModel.fromJson(jsonDecode(raw));
  }

  static Future<bool> refreshTokens() async {
    try {
      final refresh = await _storage.read(key: _keyRefresh);
      if (refresh == null) return false;
      final res = await ApiService.post(
        '${AppConfig.baseUrl}/auth/refresh',
        {'refreshToken': refresh},
        requiresAuth: false,
      );
      final data = res['data'] as Map<String, dynamic>;
      await _storage.write(key: _keyAccess,  value: data['accessToken']);
      await _storage.write(key: _keyRefresh, value: data['refreshToken']);
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _keyAccess);
    return token != null && token.isNotEmpty;
  }
}
