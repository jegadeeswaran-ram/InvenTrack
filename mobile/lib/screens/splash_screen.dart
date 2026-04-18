import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'sales_user_shell.dart';
import 'admin/admin_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final auth = context.read<AuthService>();
    await auth.init();
    if (!mounted) return;
    if (!auth.isLoggedIn) {
      _go(const LoginScreen());
    } else if (auth.isAdmin) {
      _go(const AdminShell());
    } else {
      _go(const SalesUserShell());
    }
  }

  void _go(Widget screen) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFFE0F7FA),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('🍦', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text(
              'Kulfi ICE',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Color(0xFF0097A7)),
            ),
            SizedBox(height: 8),
            Text('InvenTrack', style: TextStyle(color: Color(0xFF607D8B), letterSpacing: 2)),
            SizedBox(height: 32),
            CircularProgressIndicator(color: Color(0xFF0097A7)),
          ],
        ),
      ),
    );
  }
}
