import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/app_drawer.dart';

class AdminSalesScreen extends StatefulWidget {
  const AdminSalesScreen({super.key});

  @override
  State<AdminSalesScreen> createState() => _AdminSalesScreenState();
}

class _AdminSalesScreenState extends State<AdminSalesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _qtyCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  List<dynamic> _products = [];
  List<dynamic> _sales = [];
  dynamic _selectedProduct;
  DateTime _date = DateTime.now();
  bool _submitting = false;
  String? _msg;
  bool _msgSuccess = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _loadSales();
  }

  String? get _token => context.read<AuthService>().token;

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

  Future<void> _loadSales() async {
    final data = await ApiService.get('/sales', token: _token);
    setState(() => _sales = data);
  }

  double get _total => (double.tryParse(_qtyCtrl.text) ?? 0) * (double.tryParse(_priceCtrl.text) ?? 0);

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProduct == null) { setState(() { _msg = 'Select a product'; _msgSuccess = false; }); return; }
    setState(() { _submitting = true; _msg = null; });
    try {
      await ApiService.post('/sales', {
        'date': DateFormat('yyyy-MM-dd').format(_date),
        'productId': _selectedProduct['id'],
        'quantity': double.parse(_qtyCtrl.text),
        'pricePerUnit': double.parse(_priceCtrl.text),
        'notes': _notesCtrl.text.isEmpty ? null : _notesCtrl.text,
      }, token: _token);
      setState(() { _msg = 'Sale saved!'; _msgSuccess = true; _qtyCtrl.clear(); _priceCtrl.clear(); _notesCtrl.clear(); _selectedProduct = null; });
      _loadSales();
    } catch (e) { setState(() { _msg = e.toString(); _msgSuccess = false; }); }
    finally { setState(() => _submitting = false); }
  }

  Future<void> _delete(int id) async {
    await ApiService.delete('/sales/$id', token: _token);
    _loadSales();
  }

  Widget _dRow(String l, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(children: [
      SizedBox(width: 100, child: Text(l, style: const TextStyle(color: Color(0xFF607D8B), fontSize: 12))),
      Expanded(child: Text(v, style: const TextStyle(fontWeight: FontWeight.w600))),
    ]),
  );

  void _viewSheet(Map<String, dynamic> s) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('${s['product']?['emoji'] ?? ''} ${s['product']?['name'] ?? 'Sale'}'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          _dRow('Date', DateFormat('dd MMM yyyy').format(DateTime.parse(s['date']))),
          _dRow('Sold By', s['user']?['name'] ?? '—'),
          _dRow('Quantity', '${s['quantity']}'),
          _dRow('Price/Unit', '₹${s['pricePerUnit']}'),
          _dRow('Revenue', '₹${(s['totalRevenue'] as num).toStringAsFixed(2)}'),
          _dRow('Avg Cost', '₹${(s['avgCostUnit'] as num).toStringAsFixed(2)}'),
          _dRow('Profit', '₹${(s['profit'] as num).toStringAsFixed(2)}'),
          if (s['notes'] != null) _dRow('Notes', s['notes']),
        ]),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ),
    );
  }

  void _showEditSheet(Map<String, dynamic> sale) {
    final qtyCtrl = TextEditingController(text: sale['quantity'].toString());
    final priceCtrl = TextEditingController(text: sale['pricePerUnit'].toString());
    final notesCtrl = TextEditingController(text: sale['notes'] ?? '');
    DateTime date = DateTime.parse(sale['date']);
    dynamic selectedProduct = _products.firstWhere(
      (p) => p['id'] == sale['productId'],
      orElse: () => sale['product'],
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
                  const Text('Edit Sale', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
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
                  onChanged: (v) => setS(() {
                    selectedProduct = v;
                    if (v != null) priceCtrl.text = v['sellingPrice']?.toString() ?? '';
                  }),
                ),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: TextFormField(
                    controller: qtyCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Units Sold'),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                    onChanged: (_) => setS(() {}),
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: TextFormField(
                    controller: priceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Price/Unit ₹'),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                    onChanged: (_) => setS(() {}),
                  )),
                ]),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(8)),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Total Revenue', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text('₹ ${((double.tryParse(qtyCtrl.text) ?? 0) * (double.tryParse(priceCtrl.text) ?? 0)).toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF43A047))),
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
                      await ApiService.put('/sales/${sale['id']}', {
                        'date': DateFormat('yyyy-MM-dd').format(date),
                        'productId': selectedProduct['id'],
                        'quantity': double.parse(qtyCtrl.text),
                        'pricePerUnit': double.parse(priceCtrl.text),
                        'notes': notesCtrl.text.isEmpty ? null : notesCtrl.text,
                      }, token: _token);
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx);
                      _loadSales();
                    } catch (e) { setS(() => errorMsg = e.toString()); }
                  },
                  child: const Text('Update Sale'),
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
        title: const Text('Sales Entry'),
        leading: Builder(builder: (ctx) => IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => Scaffold.of(ctx).openDrawer())),
        actions: [IconButton(icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined), onPressed: () => context.read<ThemeNotifier>().toggle())],
      ),
      drawer: const AppDrawer(),
      body: RefreshIndicator(
        onRefresh: _loadSales,
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
                        const Text('New Sale', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
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
                            if (v != null) _priceCtrl.text = v['sellingPrice']?.toString() ?? '';
                          }),
                        ),
                        const SizedBox(height: 12),
                        Row(children: [
                          Expanded(child: TextFormField(
                            controller: _qtyCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                            decoration: const InputDecoration(labelText: 'Units Sold'),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                            onChanged: (_) => setState(() {}),
                          )),
                          const SizedBox(width: 10),
                          Expanded(child: TextFormField(
                            controller: _priceCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                            decoration: const InputDecoration(labelText: 'Price/Unit ₹'),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                            onChanged: (_) => setState(() {}),
                          )),
                        ]),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(8)),
                          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            const Text('Total Revenue', style: TextStyle(fontWeight: FontWeight.w600)),
                            Text('₹ ${_total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF43A047), fontSize: 16)),
                          ]),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(controller: _notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)')),
                        if (_msg != null) ...[
                          const SizedBox(height: 8),
                          Text(_msg!, style: TextStyle(color: _msgSuccess ? const Color(0xFF43A047) : const Color(0xFFE53935), fontWeight: FontWeight.w500)),
                        ],
                        const SizedBox(height: 14),
                        ElevatedButton(
                          onPressed: _submitting ? null : _submit,
                          child: _submitting ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Save Sale'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Sales History', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 8),
              ..._sales.map((s) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: _productAvatar(s['product']),
                  title: Text(s['product']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${s['quantity']} units × ₹${s['pricePerUnit']}\nProfit: ₹${(s['profit'] as num).toStringAsFixed(2)}'),
                  isThreeLine: true,
                  trailing: PopupMenuButton<String>(
                    onSelected: (action) {
                      if (action == 'view') _viewSheet(Map<String, dynamic>.from(s));
                      if (action == 'edit') _showEditSheet(Map<String, dynamic>.from(s));
                      if (action == 'delete') _delete(s['id']);
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
