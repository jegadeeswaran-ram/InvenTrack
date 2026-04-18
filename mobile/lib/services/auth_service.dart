import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';

class AuthUser {
  final int id;
  final String name;
  final String username;
  final String role;

  AuthUser({required this.id, required this.name, required this.username, required this.role});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'],
        name: json['name'],
        username: json['username'],
        role: json['role'],
      );
}

class AuthService extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';

  AuthUser? _user;
  String? _token;
  bool _loading = true;

  AuthUser? get user => _user;
  String? get token => _token;
  bool get isLoggedIn => _token != null && _user != null;
  bool get isLoading => _loading;
  bool get isAdmin => _user?.role == 'ADMIN';

  Future<void> init() async {
    _loading = true;
    try {
      final storedToken = await _storage.read(key: _tokenKey);
      if (storedToken != null) {
        final data = await ApiService.get('/auth/me', token: storedToken);
        _token = storedToken;
        _user = AuthUser.fromJson(data);
      }
    } catch (_) {
      await _storage.delete(key: _tokenKey);
      _token = null;
      _user = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String username, String password) async {
    final data = await ApiService.post('/auth/login', {
      'username': username,
      'password': password,
    });
    _token = data['token'];
    _user = AuthUser.fromJson(data['user']);
    await _storage.write(key: _tokenKey, value: _token);
    notifyListeners();
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    _token = null;
    _user = null;
    notifyListeners();
  }
}
