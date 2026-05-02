import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../widgets/inventrack_logo.dart';
import 'login_screen.dart';
import 'sales_user_shell.dart';
import 'admin/admin_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _scaleCtrl;
  late final AnimationController _fadeCtrl;
  late final Animation<double> _scale;
  late final Animation<double> _fade;
  late final Animation<double> _textFade;

  @override
  void initState() {
    super.initState();

    _scaleCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fadeCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));

    _scale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _scaleCtrl, curve: Curves.elasticOut),
    );
    _fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _scaleCtrl, curve: const Interval(0.0, 0.6, curve: Curves.easeIn)),
    );
    _textFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn),
    );

    _scaleCtrl.forward();
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _fadeCtrl.forward();
    });

    _init();
  }

  @override
  void dispose() {
    _scaleCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    final auth = context.read<AuthService>();
    await auth.init();
    await Future.delayed(const Duration(milliseconds: 1800));
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
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => screen,
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1F2D),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ScaleTransition(
              scale: _scale,
              child: FadeTransition(
                opacity: _fade,
                child: SvgPicture.asset(
                  'assets/images/logo_splash.svg',
                  width: 200,
                ),
              ),
            ),
            const SizedBox(height: 28),
            FadeTransition(
              opacity: _textFade,
              child: Column(children: [
                const InvenTrackLogo(width: 220, textColor: Colors.white),
                const SizedBox(height: 32),
                const SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    color: Color(0xFF00AEEE),
                    strokeWidth: 2.5,
                  ),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}
