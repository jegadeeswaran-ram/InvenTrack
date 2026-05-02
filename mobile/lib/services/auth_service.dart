import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthUser {
  final int id;
  final String name;
  final String username;
  final String email;
  final String? photo;
  final String role;

  AuthUser({required this.id, required this.name, required this.username, required this.email, this.photo, required this.role});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'],
        name: json['name'],
        username: json['username'],
        email: json['email'] ?? '',
        photo: json['photo'],
        role: json['role'],
      );

  AuthUser copyWith({String? name, String? username, String? email, String? photo}) => AuthUser(
        id: id,
        name: name ?? this.name,
        username: username ?? this.username,
        email: email ?? this.email,
        photo: photo ?? this.photo,
        role: role,
      );
}

class AuthService extends ChangeNotifier {
  static SharedPreferences? _storage;
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
    _storage ??= await SharedPreferences.getInstance();
    try {
      final storedToken = _storage!.getString(_tokenKey);
      if (storedToken != null) {
        final data = await ApiService.get('/auth/me', token: storedToken);
        _token = storedToken;
        _user = AuthUser.fromJson(data);
      }
    } catch (_) {
      await _storage!.remove(_tokenKey);
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
    await _storage!.setString(_tokenKey, _token!);
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    final updated = await ApiService.put('/auth/profile', data, token: _token);
    _user = AuthUser.fromJson(updated);
    notifyListeners();
  }

  Future<void> logout() async {
    await _storage!.remove(_tokenKey);
    _token = null;
    _user = null;
    notifyListeners();
  }
}
