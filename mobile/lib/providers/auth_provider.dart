import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _loading = true;

  UserModel? get user    => _user;
  bool get isLoading     => _loading;
  bool get isLoggedIn    => _user != null;

  Future<void> init() async {
    _loading = true;
    notifyListeners();
    try {
      if (await AuthService.isLoggedIn()) {
        _user = await AuthService.getSavedUser();
      }
    } catch (_) {
      _user = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String loginId, String password) async {
    final data = await AuthService.login(loginId, password);
    _user = UserModel.fromJson(data['user']);
    notifyListeners();
  }

  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    notifyListeners();
  }
}
