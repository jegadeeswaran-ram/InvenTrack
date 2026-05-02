import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'providers/dispatch_provider.dart';
import 'providers/sales_provider.dart';
import 'providers/closing_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/sales_screen.dart';
import 'screens/live_stock_screen.dart';
import 'screens/closing_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const InvenTrackApp());
}

class InvenTrackApp extends StatelessWidget {
  const InvenTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => DispatchProvider()),
        ChangeNotifierProvider(create: (_) => SalesProvider()),
        ChangeNotifierProvider(create: (_) => ClosingProvider()),
      ],
      child: MaterialApp(
        title: 'InvenTrack',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
          fontFamily: 'Roboto',
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Color(0xFF111827),
            elevation: 0,
            titleTextStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
          ),
          scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        ),
        home: const _Splash(),
        routes: {
          AppRoutes.login:     (_) => const LoginScreen(),
          AppRoutes.home:      (_) => const HomeScreen(),
          AppRoutes.sales:     (_) => const SalesScreen(),
          AppRoutes.liveStock: (_) => const LiveStockScreen(),
          AppRoutes.closing:   (_) => const ClosingScreen(),
          AppRoutes.profile:   (_) => const ProfileScreen(),
        },
      ),
    );
  }
}

class _Splash extends StatefulWidget {
  const _Splash();
  @override
  State<_Splash> createState() => _SplashState();
}

class _SplashState extends State<_Splash> {
  @override
  void initState() {
    super.initState();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    while (auth.isLoading) {
      await Future.delayed(const Duration(milliseconds: 50));
    }
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, auth.isLoggedIn ? AppRoutes.home : AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF4F46E5),
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.inventory_2_outlined, color: Colors.white, size: 56),
          SizedBox(height: 16),
          Text('InvenTrack', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
          SizedBox(height: 8),
          Text('Kulfi ICE Management', style: TextStyle(color: Colors.white70, fontSize: 14)),
        ]),
      ),
    );
  }
}
