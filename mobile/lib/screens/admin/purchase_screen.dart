import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/app_drawer.dart';

class PurchaseScreen extends StatefulWidget {
  const PurchaseScreen({super.key});

  @override
  State<PurchaseScreen> createState() => _PurchaseScreenState();
}

class _PurchaseScreenState extends State<PurchaseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _mfrCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _costCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  List<dynamic> _products = [];
  List<dynamic> _purchases = [];
  Map<int, double> _avgCostMap = {};
  dynamic _selectedProduct;
  DateTime _date = DateTime.now();
  bool _submitting = false;
  String? _msg;
  bool _msgSuccess = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _loadPurchases();
    _loadStockAvg();
  }

  String? get _token => context.read<AuthService>().token;

  Future<void> _loadStockAvg() async {
    try {
      final data = await ApiService.get('/reports/stock', token: _token) as List;
      final map = <int, double>{};
      for (final item in data) {
        map[item['productId'] as int] = (item['avgCostPerUnit'] as num).toDouble();
      }
      setState(() => _avgCostMap = map);
    } catch (_) {}
  }

  Widget _productAvatar(dynamic p) {
    final url = p?['imageUrl'] as String?;
    if (url != null && url.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.network(
          url,
          width: 52, height: 52,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _avatarFallback(),
        ),
      );
    }
    return _avatarFallback();
  }

  Widget _avatarFallback() => Container(
    width: 52, height: 52,
    decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(10)),
    child: const Icon(Icons.icecream_outlined, color: Color(0xFF0097A7), size: 26),
  );

  Future<void> _loadProducts() async {
    final data = await ApiService.get('/products', token: _token);
    setState(() => _products = data);
  }

  Future<void> _loadPurchases() async {
    final data = await ApiService.get('/purchases', token: _token);
    setState(() => _purchases = data);
  }

  double get _total => (double.tryParse(_qtyCtrl.text) ?? 0) * (double.tryParse(_costCtrl.text) ?? 0);

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProduct == null) { setState(() { _msg = 'Select a product'; _msgSuccess = false; }); return; }
    setState(() { _submitting = true; _msg = null; });
    try {
      await ApiService.post('/purchases', {
        'date': DateFormat('yyyy-MM-dd').format(_date),
        'productId': _selectedProduct['id'],
        'manufacturer': _mfrCtrl.text.trim(),
        'quantity': double.parse(_qtyCtrl.text),
        'costPerUnit': double.parse(_costCtrl.text),
        'notes': _notesCtrl.text.isEmpty ? null : _notesCtrl.text,
      }, token: _token);
      setState(() { _msg = 'Purchase saved!'; _msgSuccess = true; _mfrCtrl.clear(); _qtyCtrl.clear(); _costCtrl.clear(); _notesCtrl.clear(); _selectedProduct = null; });
      _loadPurchases();
    } catch (e) { setState(() { _msg = e.toString(); _msgSuccess = false; }); }
    finally { setState(() => _submitting = false); }
  }

  Future<void> _delete(int id) async {
    await ApiService.delete('/purchases/$id', token: _token);
    _loadPurchases();
  }

  Widget _dRow(String l, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(children: [
      SizedBox(width: 90, child: Text(l, style: const TextStyle(color: Color(0xFF607D8B), fontSize: 12))),
      Expanded(child: Text(v, style: const TextStyle(fontWeight: FontWeight.w600))),
    ]),
  );

  void _viewSheet(Map<String, dynamic> p) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('${p['product']?['emoji'] ?? ''} ${p['product']?['name'] ?? 'Purchase'}'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          _dRow('Date', DateFormat('dd MMM yyyy').format(DateTime.parse(p['date']))),
          _dRow('Manufacturer', p['manufacturer']),
          _dRow('Quantity', '${p['quantity']}'),
          _dRow('Cost/Unit', '₹${p['costPerUnit']}'),
          _dRow('Total Cost', '₹${(p['totalCost'] as num).toStringAsFixed(2)}'),
          if (p['notes'] != null) _dRow('Notes', p['notes']),
        ]),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ),
    );
  }

  void _showEditSheet(Map<String, dynamic> purchase) {
    final mfrCtrl = TextEditingController(text: purchase['manufacturer']);
    final qtyCtrl = TextEditingController(text: purchase['quantity'].toString());
    final costCtrl = TextEditingController(text: purchase['costPerUnit'].toString());
    final notesCtrl = TextEditingController(text: purchase['notes'] ?? '');
    DateTime date = DateTime.parse(purchase['date']);
    dynamic selectedProduct = _products.firstWhere(
      (p) => p['id'] == purchase['productId'],
      orElse: () => purchase['product'],
    );
    final formKey = GlobalKey<FormState>();
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Edit Purchase', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ]),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () async {
                    final d = await showDatePicker(context: ctx, initialDate: date, firstDate: DateTime(2020), lastDate: DateTime.now());
                    if (d != null) setS(() => date = d);
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Date', prefixIcon: Icon(Icons.calendar_today_outlined)),
                    child: Text(DateFormat('dd MMM yyyy').format(date)),
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<dynamic>(
                  initialValue: selectedProduct,
                  decoration: const InputDecoration(labelText: 'Product'),
                  items: _products.map((p) => DropdownMenuItem(value: p, child: Text(p['name']))).toList(),
                  onChanged: (v) => setS(() => selectedProduct = v),
                ),
                const SizedBox(height: 10),
                TextFormField(controller: mfrCtrl, decoration: const InputDecoration(labelText: 'Manufacturer'), validator: (v) => v!.isEmpty ? 'Required' : null),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: TextFormField(
                    controller: qtyCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Quantity'),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                    onChanged: (_) => setS(() {}),
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: TextFormField(
                    controller: costCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Cost/Unit ₹'),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                    onChanged: (_) => setS(() {}),
                  )),
                ]),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(8)),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Total Cost', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text('₹ ${((double.tryParse(qtyCtrl.text) ?? 0) * (double.tryParse(costCtrl.text) ?? 0)).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0097A7))),
                  ]),
                ),
                const SizedBox(height: 10),
                TextFormField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)')),
                if (errorMsg != null) ...[const SizedBox(height: 6), Text(errorMsg!, style: const TextStyle(color: Color(0xFFE53935)))],
                const SizedBox(height: 14),
                ElevatedButton(
                  onPressed: () async {
                    if (!formKey.currentState!.validate()) return;
                    setS(() => errorMsg = null);
                    try {
                      await ApiService.put('/purchases/${purchase['id']}', {
                        'date': DateFormat('yyyy-MM-dd').format(date),
                        'productId': selectedProduct['id'],
                        'manufacturer': mfrCtrl.text.trim(),
                        'quantity': double.parse(qtyCtrl.text),
                        'costPerUnit': double.parse(costCtrl.text),
                        'notes': notesCtrl.text.isEmpty ? null : notesCtrl.text,
                      }, token: _token);
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx);
                      _loadPurchases();
                    } catch (e) { setS(() => errorMsg = e.toString()); }
                  },
                  child: const Text('Update Purchase'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeNotifier>().isDark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Purchase Entry'),
        leading: Builder(builder: (ctx) => IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => Scaffold.of(ctx).openDrawer())),
        actions: [IconButton(icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined), onPressed: () => context.read<ThemeNotifier>().toggle())],
      ),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: _loadPurchases,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('New Purchase', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                        const SizedBox(height: 12),
                        InkWell(
                          onTap: () async {
                            final d = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2020), lastDate: DateTime.now());
                            if (d != null) setState(() => _date = d);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(labelText: 'Date', prefixIcon: Icon(Icons.calendar_today_outlined)),
                            child: Text(DateFormat('dd MMM yyyy').format(_date)),
                          ),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<dynamic>(
                          initialValue: _selectedProduct,
                          decoration: const InputDecoration(labelText: 'Product', prefixIcon: Icon(Icons.icecream_outlined)),
                          hint: const Text('Select product…'),
                          items: _products.map((p) => DropdownMenuItem(value: p, child: Text(p['name']))).toList(),
                          onChanged: (v) => setState(() {
                            _selectedProduct = v;
                            if (v != null) {
                              final avg = _avgCostMap[v['id'] as int];
                              if (avg != null && avg > 0) _costCtrl.text = avg.toStringAsFixed(2);
                            }
                          }),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _mfrCtrl,
                          decoration: const InputDecoration(labelText: 'Manufacturer', prefixIcon: Icon(Icons.factory_outlined)),
                          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                        ),
                        const SizedBox(height: 12),
                        Row(children: [
                          Expanded(child: TextFormField(
                            controller: _qtyCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                            decoration: const InputDecoration(labelText: 'Quantity', prefixIcon: Icon(Icons.numbers)),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                            onChanged: (_) => setState(() {}),
                          )),
                          const SizedBox(width: 10),
                          Expanded(child: TextFormField(
                            controller: _costCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                            decoration: const InputDecoration(labelText: 'Cost/Unit ₹', prefixIcon: Icon(Icons.currency_rupee)),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                            onChanged: (_) => setState(() {}),
                          )),
                        ]),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(8)),
                          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            const Text('Total Cost', style: TextStyle(fontWeight: FontWeight.w600)),
                            Text('₹ ${_total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0097A7), fontSize: 16)),
                          ]),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(controller: _notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)', prefixIcon: Icon(Icons.note_outlined))),
                        if (_msg != null) ...[
                          const SizedBox(height: 8),
                          Text(_msg!, style: TextStyle(color: _msgSuccess ? const Color(0xFF43A047) : const Color(0xFFE53935), fontWeight: FontWeight.w500)),
                        ],
                        const SizedBox(height: 14),
                        ElevatedButton(
                          onPressed: _submitting ? null : _submit,
                          child: _submitting ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Save Purchase'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Purchase History', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 8),
              ..._purchases.map((p) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: _productAvatar(p['product']),
                  title: Text(p['product']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${p['quantity']} units × ₹${p['costPerUnit']}\n${p['manufacturer']}'),
                  isThreeLine: true,
                  trailing: PopupMenuButton<String>(
                    onSelected: (action) {
                      if (action == 'view') _viewSheet(Map<String, dynamic>.from(p));
                      if (action == 'edit') _showEditSheet(Map<String, dynamic>.from(p));
                      if (action == 'delete') _delete(p['id']);
                    },
                    itemBuilder: (_) => [
                      const PopupMenuItem(value: 'view', child: Row(children: [Icon(Icons.visibility_outlined, size: 18), SizedBox(width: 8), Text('View')])),
                      const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit')])),
                      const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: Color(0xFFE53935)), SizedBox(width: 8), Text('Delete', style: TextStyle(color: Color(0xFFE53935)))])),
                    ],
                  ),
                ),
              )),
            ],
          ),
        ),
      ),
    );
  }
}
