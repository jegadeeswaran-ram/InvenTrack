import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/auth_service.dart';
import '../widgets/inventrack_logo.dart';
import 'sales_user_shell.dart';
import 'admin/admin_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      final auth = context.read<AuthService>();
      await auth.login(_usernameCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      if (auth.isAdmin) {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const AdminShell()));
      } else {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const SalesUserShell()));
      }
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = context.watch<ThemeNotifier>().isDark;

    return Scaffold(
      body: SafeArea(
        child: Stack(children: [
          // Background gradient
          Container(decoration: BoxDecoration(gradient: LinearGradient(
            begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: isDark
                ? [const Color(0xFF0A1219), const Color(0xFF0F1923)]
                : [const Color(0xFF0D1F2D), const Color(0xFF1A3A4A)],
          ))),

          Center(child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              // Logo
              const InvenTrackLogo(width: 280, textColor: Colors.white),
              const SizedBox(height: 36),

              // Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1A2635) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.4 : 0.12), blurRadius: 24, offset: const Offset(0, 8))],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Text('Sign In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _usernameCtrl,
                      decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.person_outline_rounded)),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passwordCtrl,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                      onFieldSubmitted: (_) => _login(),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.red.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                        child: Row(children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 16),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                        ]),
                      ),
                    ],
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _loading ? null : _login,
                      child: _loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Sign In'),
                    ),
                  ]),
                ),
              ),

              const SizedBox(height: 20),
              // Theme toggle
              TextButton.icon(
                onPressed: () => context.read<ThemeNotifier>().toggle(),
                icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, color: Colors.white54, size: 16),
                label: Text(isDark ? 'Switch to Light' : 'Switch to Dark', style: const TextStyle(color: Colors.white54, fontSize: 12)),
              ),
            ]),
          )),
        ]),
      ),
    );
  }
}
