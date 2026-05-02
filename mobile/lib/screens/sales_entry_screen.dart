import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class SalesEntryScreen extends StatefulWidget {
  const SalesEntryScreen({super.key});
  @override
  State<SalesEntryScreen> createState() => _SalesEntryScreenState();
}

class _SalesEntryScreenState extends State<SalesEntryScreen> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _qtyCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  List<dynamic> _products = [];
  List<dynamic> _todaySales = [];
  dynamic _selectedProduct;
  DateTime _date = DateTime.now();
  bool _submitting = false;
  bool _loadingProducts = true;
  String? _msg;
  bool _msgSuccess = false;
  Timer? _msgTimer;

  static const SpellCheckConfiguration _noSpellCheck =
      SpellCheckConfiguration.disabled();

  late AnimationController _headerCtrl;
  late AnimationController _formCtrl;
  late AnimationController _listCtrl;
  late Animation<double> _headerAnim;
  late Animation<double> _formAnim;

  @override
  void initState() {
    super.initState();
    _headerCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _formCtrl   = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _listCtrl   = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _headerAnim = CurvedAnimation(parent: _headerCtrl, curve: Curves.easeOutBack);
    _formAnim   = CurvedAnimation(parent: _formCtrl, curve: Curves.easeOut);
    _headerCtrl.forward();
    Future.delayed(const Duration(milliseconds: 200), () => _formCtrl.forward());
    _loadProducts();
    _loadTodaySales();
  }

  @override
  void dispose() {
    _msgTimer?.cancel();
    _headerCtrl.dispose();
    _formCtrl.dispose();
    _listCtrl.dispose();
    _qtyCtrl.dispose();
    _priceCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    final token = context.read<AuthService>().token;
    try {
      final data = await ApiService.get('/products', token: token);
      setState(() { _products = data; _loadingProducts = false; });
    } catch (_) { setState(() => _loadingProducts = false); }
  }

  Future<void> _loadTodaySales() async {
    final token = context.read<AuthService>().token;
    final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    try {
      final data = await ApiService.get('/sales?date=$dateStr', token: token);
      setState(() => _todaySales = data);
      _listCtrl.forward(from: 0);
    } catch (_) {}
  }

  double get _totalRevenue => (double.tryParse(_qtyCtrl.text) ?? 0) * (double.tryParse(_priceCtrl.text) ?? 0);

  void _clearFeedbackSoon() {
    _msgTimer?.cancel();
    _msgTimer = Timer(const Duration(seconds: 3), () {
      if (!mounted) return;
      setState(() => _msg = null);
    });
  }

  void _dismissMsgOnEdit() {
    if (_msg == null) return;
    _msgTimer?.cancel();
    setState(() => _msg = null);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProduct == null) {
      setState(() { _msg = 'Please select a product'; _msgSuccess = false; });
      return;
    }
    setState(() { _submitting = true; _msg = null; });
    final token = context.read<AuthService>().token;
    try {
      await ApiService.post('/sales', {
        'date': DateFormat('yyyy-MM-dd').format(_date),
        'productId': _selectedProduct['id'],
        'quantity': double.parse(_qtyCtrl.text),
        'pricePerUnit': double.parse(_priceCtrl.text),
        'notes': _notesCtrl.text.isEmpty ? null : _notesCtrl.text,
      }, token: token);
      setState(() {
        _msg = 'Sale saved successfully!';
        _msgSuccess = true;
        _qtyCtrl.clear();
        _priceCtrl.clear();
        _notesCtrl.clear();
        _selectedProduct = null;
      });
      _clearFeedbackSoon();
      _loadTodaySales();
    } catch (e) {
      setState(() { _msg = e.toString(); _msgSuccess = false; });
    } finally {
      setState(() => _submitting = false);
    }
  }

  Widget _productAvatar(dynamic p) {
    final url = p?['imageUrl'] as String?;
    if (url != null && url.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.network(url, width: 48, height: 48, fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _avatarFallback()),
      );
    }
    return _avatarFallback();
  }

  Widget _avatarFallback() => Container(
    width: 48, height: 48,
    decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(10)),
    child: const Icon(Icons.icecream_outlined, color: Color(0xFF0097A7), size: 24),
  );

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final user = context.watch<AuthService>().user;
    final name = user?.name ?? 'there';

    return RefreshIndicator(
      color: const Color(0xFF0097A7),
      onRefresh: () async { await _loadProducts(); await _loadTodaySales(); },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header greeting
            ScaleTransition(
              scale: _headerAnim,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF006064), Color(0xFF0097A7), Color(0xFF00BCD4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: const Color(0xFF0097A7).withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6))],
                ),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Hello, $name!', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(DateFormat('EEEE, dd MMM yyyy').format(DateTime.now()), style: const TextStyle(color: Color(0xFFB2EBF2), fontSize: 12)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(10)),
                      child: Text('${_todaySales.length} sale${_todaySales.length == 1 ? '' : 's'} today',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                    ),
                  ])),
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                    child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 28),
                  ),
                ]),
              ),
            ),
            const SizedBox(height: 20),

            // Sale form
            FadeTransition(
              opacity: _formAnim,
              child: SlideTransition(
                position: Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(_formAnim),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))]),
                  child: Form(
                    key: _formKey,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Container(width: 36, height: 36, decoration: BoxDecoration(color: const Color(0xFF0097A7).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                          child: const Icon(Icons.add_circle_outline_rounded, color: Color(0xFF0097A7), size: 20)),
                        const SizedBox(width: 10),
                        Text(
                          'New Sale Entry',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: cs.onSurface,
                          ),
                        ),
                      ]),
                      const SizedBox(height: 18),

                      // Date
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () async {
                            final d = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2020), lastDate: DateTime.now());
                            if (d != null) {
                              _dismissMsgOnEdit();
                              setState(() => _date = d);
                            }
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: InputDecorator(
                            decoration: const InputDecoration(labelText: 'Date', prefixIcon: Icon(Icons.calendar_today_outlined)),
                            child: Text(
                              DateFormat('dd MMM yyyy').format(_date),
                              style: TextStyle(color: cs.onSurface),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Product
                      _loadingProducts
                          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0097A7)))
                          : DropdownButtonFormField<dynamic>(
                              value: _selectedProduct,
                              decoration: const InputDecoration(labelText: 'Product', prefixIcon: Icon(Icons.icecream_outlined)),
                              hint: const Text('Select product…'),
                              items: _products.map((p) => DropdownMenuItem(value: p, child: Text(p['name']))).toList(),
                              onChanged: (v) {
                                _dismissMsgOnEdit();
                                setState(() {
                                  _selectedProduct = v;
                                  if (v != null) _priceCtrl.text = v['sellingPrice']?.toString() ?? '';
                                });
                              },
                            ),
                      const SizedBox(height: 14),

                      // Qty + Price
                      Row(children: [
                        Expanded(child: TextFormField(
                          controller: _qtyCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                          decoration: const InputDecoration(labelText: 'Units Sold'),
                          spellCheckConfiguration: _noSpellCheck,
                          autocorrect: false,
                          enableSuggestions: false,
                          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          onChanged: (_) {
                            _dismissMsgOnEdit();
                            setState(() {});
                          },
                        )),
                        const SizedBox(width: 12),
                        Expanded(child: TextFormField(
                          controller: _priceCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                          decoration: const InputDecoration(labelText: 'Price/Unit ₹'),
                          spellCheckConfiguration: _noSpellCheck,
                          autocorrect: false,
                          enableSuggestions: false,
                          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          onChanged: (_) {
                            _dismissMsgOnEdit();
                            setState(() {});
                          },
                        )),
                      ]),
                      const SizedBox(height: 14),

                      // Total
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFFE0F7FA), Color(0xFFE8F5E9)], begin: Alignment.centerLeft, end: Alignment.centerRight),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          const Row(children: [
                            Icon(Icons.currency_rupee_rounded, color: Color(0xFF0097A7), size: 16),
                            SizedBox(width: 4),
                            Text('Total Revenue', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          ]),
                          Text('₹ ${_totalRevenue.toStringAsFixed(2)}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0097A7))),
                        ]),
                      ),
                      const SizedBox(height: 14),

                      TextFormField(
                        controller: _notesCtrl,
                        decoration: const InputDecoration(labelText: 'Notes (optional)', prefixIcon: Icon(Icons.note_outlined)),
                        maxLines: 2,
                        spellCheckConfiguration: _noSpellCheck,
                        onChanged: (_) => _dismissMsgOnEdit(),
                      ),

                      if (_msg != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: _msgSuccess ? const Color(0xFFE8F5E9) : const Color(0xFFFFEBEE),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(children: [
                            Icon(_msgSuccess ? Icons.check_circle_outline : Icons.error_outline,
                                color: _msgSuccess ? const Color(0xFF43A047) : const Color(0xFFE53935), size: 18),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_msg!, style: TextStyle(color: _msgSuccess ? const Color(0xFF2E7D32) : const Color(0xFFB71C1C), fontWeight: FontWeight.w500, fontSize: 13))),
                          ]),
                        ),
                      ],
                      const SizedBox(height: 18),

                      ElevatedButton.icon(
                        onPressed: _submitting ? null : _submit,
                        icon: _submitting
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.save_rounded, color: Colors.white),
                        label: Text(_submitting ? 'Saving…' : 'Save Sale', style: const TextStyle(color: Colors.white)),
                      ),
                    ]),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Today's entries
            Row(children: [
              Container(width: 4, height: 18, decoration: BoxDecoration(color: const Color(0xFF0097A7), borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 8),
              Text(
                "Today's Entries",
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: cs.onSurface),
              ),
              const Spacer(),
              if (_todaySales.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFF0097A7).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                  child: Text('${_todaySales.length}', style: const TextStyle(color: Color(0xFF0097A7), fontWeight: FontWeight.w700, fontSize: 12)),
                ),
            ]),
            const SizedBox(height: 12),

            if (_todaySales.isEmpty)
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(16)),
                child: Center(child: Column(children: [
                  Icon(Icons.receipt_long_outlined, size: 40, color: cs.onSurface.withValues(alpha: 0.2)),
                  const SizedBox(height: 8),
                  Text('No sales recorded today', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.4), fontSize: 13)),
                ])),
              )
            else
              ...List.generate(_todaySales.length, (i) {
                final s = _todaySales[i];
                final delay = (i * 0.08).clamp(0.0, 0.5);
                final anim = CurvedAnimation(
                  parent: _listCtrl,
                  curve: Interval(delay, (delay + 0.4).clamp(0.0, 1.0), curve: Curves.easeOut),
                );
                return AnimatedBuilder(
                  animation: anim,
                  builder: (_, child) => Transform.translate(
                    offset: Offset(0, 20 * (1 - anim.value)),
                    child: Opacity(opacity: anim.value.clamp(0.0, 1.0), child: child),
                  ),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))]),
                    child: Row(children: [
                      _productAvatar(s['product']),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(s['product']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                        const SizedBox(height: 2),
                        Text('${s['quantity']} units × ₹${s['pricePerUnit']}',
                            style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5))),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text('₹${(s['totalRevenue'] as num).toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0097A7), fontSize: 15)),
                        const SizedBox(height: 2),
                        Text(DateFormat('dd MMM').format(DateTime.parse(s['date'])),
                            style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.4))),
                      ]),
                    ]),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
