import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _usernameCtrl;
  late TextEditingController _emailCtrl;
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _saving = false;
  String? _photoBase64;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthService>().user!;
    _nameCtrl = TextEditingController(text: user.name);
    _usernameCtrl = TextEditingController(text: user.username);
    _emailCtrl = TextEditingController(text: user.email);
    _photoBase64 = user.photo;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 60, maxWidth: 400);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    setState(() => _photoBase64 = base64Encode(bytes));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordCtrl.text.isNotEmpty && _passwordCtrl.text != _confirmCtrl.text) {
      _showError('Passwords do not match');
      return;
    }
    setState(() => _saving = true);
    try {
      final data = <String, dynamic>{
        'name': _nameCtrl.text.trim(),
        'username': _usernameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'photo': _photoBase64,
      };
      if (_passwordCtrl.text.isNotEmpty) data['password'] = _passwordCtrl.text;
      await context.read<AuthService>().updateProfile(data);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully'), backgroundColor: Color(0xFF00A550)),
      );
      _passwordCtrl.clear();
      _confirmCtrl.clear();
    } catch (e) {
      _showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().user!;
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        centerTitle: true,
        backgroundColor: const Color(0xFF0095DA),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            // Avatar
            Center(
              child: Stack(children: [
                GestureDetector(
                  onTap: _pickPhoto,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0095DA), Color(0xFF00A550)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [BoxShadow(color: const Color(0xFF0095DA).withValues(alpha:0.4), blurRadius: 16, offset: const Offset(0, 4))],
                    ),
                    child: _photoBase64 != null
                        ? ClipOval(child: Image.memory(base64Decode(_photoBase64!), fit: BoxFit.cover, width: 100, height: 100))
                        : Center(child: Text(user.name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.bold))),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: _pickPhoto,
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0095DA),
                        shape: BoxShape.circle,
                        border: Border.all(color: isDark ? const Color(0xFF1A2635) : Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 8),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFF0095DA).withValues(alpha:0.15), borderRadius: BorderRadius.circular(20)),
                child: Text(user.role, style: const TextStyle(color: Color(0xFF0095DA), fontWeight: FontWeight.w600, fontSize: 12)),
              ),
            ),
            const SizedBox(height: 28),

            _sectionLabel('Personal Info'),
            const SizedBox(height: 12),
            _field(controller: _nameCtrl, label: 'Full Name', icon: Icons.person_outline,
              validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null),
            const SizedBox(height: 14),
            _field(controller: _emailCtrl, label: 'Email Address', icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 28),

            _sectionLabel('Account'),
            const SizedBox(height: 12),
            _field(controller: _usernameCtrl, label: 'Username', icon: Icons.alternate_email,
              validator: (v) => v == null || v.trim().isEmpty ? 'Username is required' : null),
            const SizedBox(height: 28),

            _sectionLabel('Change Password'),
            const SizedBox(height: 4),
            Text('Leave blank to keep current password', style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha:0.5))),
            const SizedBox(height: 12),
            _passwordField(controller: _passwordCtrl, label: 'New Password', obscure: _obscurePass,
              onToggle: () => setState(() => _obscurePass = !_obscurePass)),
            const SizedBox(height: 14),
            _passwordField(controller: _confirmCtrl, label: 'Confirm Password', obscure: _obscureConfirm,
              onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm)),
            const SizedBox(height: 32),

            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0095DA),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                child: _saving
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 20),
          ]),
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0095DA), letterSpacing: 0.5));

  Widget _field({required TextEditingController controller, required String label, required IconData icon,
    String? Function(String?)? validator, TextInputType? keyboardType}) {
    final cs = Theme.of(context).colorScheme;
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: const Color(0xFF0095DA), size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: cs.outline)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0095DA), width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Widget _passwordField({required TextEditingController controller, required String label, required bool obscure, required VoidCallback onToggle}) {
    final cs = Theme.of(context).colorScheme;
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      validator: (v) {
        if (v != null && v.isNotEmpty && v.length < 6) return 'At least 6 characters';
        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF0095DA), size: 20),
        suffixIcon: IconButton(icon: Icon(obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: cs.onSurface.withValues(alpha:0.5), size: 20), onPressed: onToggle),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: cs.outline)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0095DA), width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
