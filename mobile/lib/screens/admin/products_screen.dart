import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import 'admin_shell.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<dynamic> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  String? get _token => context.read<AuthService>().token;

  Future<void> _load() async {
    try {
      final data = await ApiService.get('/products', token: _token);
      setState(() { _products = data; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Widget _productAvatar(dynamic p) {
    final url = p?['imageUrl'] as String?;
    if (url != null && url.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(url, width: 48, height: 48, fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _avatarPlaceholder()),
      );
    }
    return _avatarPlaceholder();
  }

  Widget _avatarPlaceholder() => Container(
    width: 48, height: 48,
    decoration: BoxDecoration(color: const Color(0xFFE0F7FA), borderRadius: BorderRadius.circular(8)),
    child: const Icon(Icons.icecream_outlined, color: Color(0xFF0097A7), size: 24),
  );

  void _showForm({Map<String, dynamic>? product}) {
    final isEdit = product != null;
    final nameCtrl = TextEditingController(text: product?['name'] ?? '');
    final priceCtrl = TextEditingController(text: product?['sellingPrice']?.toString() ?? '');
    final imageCtrl = TextEditingController(text: product?['imageUrl'] ?? '');
    final formKey = GlobalKey<FormState>();
    String? errorMsg;
    bool uploading = false;
    List<dynamic> recentMedia = [];
    Future<void> loadRecentMedia(StateSetter setS) async {
      try {
        final data = await ApiService.get('/media', token: _token) as List;
        setS(() => recentMedia = data.take(12).toList());
      } catch (_) {}
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) {
          if (recentMedia.isEmpty) loadRecentMedia(setS);
          return Padding(
            padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(isEdit ? 'Edit Product' : 'Add Product', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'Product Name', prefixIcon: Icon(Icons.label_outline)),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: priceCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                      decoration: const InputDecoration(labelText: 'Selling Price ₹', prefixIcon: Icon(Icons.currency_rupee)),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: imageCtrl,
                      decoration: const InputDecoration(labelText: 'Image URL (optional)', prefixIcon: Icon(Icons.image_outlined)),
                      onChanged: (v) => setS(() {}),
                    ),
                    if (imageCtrl.text.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(imageCtrl.text, width: 60, height: 60, fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const SizedBox()),
                        ),
                        const SizedBox(width: 10),
                        TextButton.icon(
                          onPressed: () { imageCtrl.clear(); setS(() {}); },
                          icon: const Icon(Icons.close, size: 16, color: Color(0xFFE53935)),
                          label: const Text('Remove', style: TextStyle(color: Color(0xFFE53935), fontSize: 12)),
                        ),
                      ]),
                    ],
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: uploading
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.upload_rounded, size: 18),
                        label: Text(uploading ? 'Uploading…' : 'Upload Image'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0097A7),
                          side: const BorderSide(color: Color(0xFF0097A7)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: uploading ? null : () async {
                          final result = await FilePicker.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['jpg', 'jpeg', 'png'],
                            allowMultiple: false,
                            withData: true,
                          );
                          if (result == null || result.files.isEmpty) return;
                          final file = result.files.first;
                          if (file.bytes == null) return;
                          setS(() => uploading = true);
                          try {
                            final res = await ApiService.uploadFile('/media/upload', file.bytes!, file.name, token: _token);
                            final url = res['url'] as String?;
                            if (url != null) {
                              imageCtrl.text = url;
                              await loadRecentMedia(setS);
                            }
                          } catch (e) {
                            setS(() => errorMsg = e.toString());
                          } finally {
                            setS(() => uploading = false);
                          }
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text('Recent Images', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF607D8B))),
                    const SizedBox(height: 8),
                    recentMedia.isEmpty
                        ? const Text('No images uploaded yet', style: TextStyle(fontSize: 12, color: Color(0xFF607D8B)))
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 4, crossAxisSpacing: 8, mainAxisSpacing: 8),
                            itemCount: recentMedia.length,
                            itemBuilder: (_, i) {
                              final m = recentMedia[i];
                              final selected = imageCtrl.text == (m['url'] as String);
                              return GestureDetector(
                                onTap: () { imageCtrl.text = m['url'] as String; setS(() {}); },
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: selected ? const Color(0xFF0097A7) : Colors.transparent, width: 2.5),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: Image.network(m['url'] as String, fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => const Icon(Icons.broken_image_outlined)),
                                  ),
                                ),
                              );
                            },
                          ),
                    if (errorMsg != null) ...[
                      const SizedBox(height: 8),
                      Text(errorMsg!, style: const TextStyle(color: Color(0xFFE53935), fontSize: 13)),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () async {
                        if (!formKey.currentState!.validate()) return;
                        setS(() => errorMsg = null);
                        try {
                          final body = <String, dynamic>{
                            'name': nameCtrl.text.trim(),
                            'emoji': '🍦',
                            'sellingPrice': double.parse(priceCtrl.text),
                            'imageUrl': imageCtrl.text.trim().isEmpty ? null : imageCtrl.text.trim(),
                          };
                          if (!isEdit) {
                            await ApiService.post('/products', body, token: _token);
                          } else {
                            await ApiService.put('/products/${product['id']}', body, token: _token);
                          }
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          _load();
                        } catch (e) {
                          setS(() => errorMsg = e.toString());
                        }
                      },
                      child: Text(isEdit ? 'Update Product' : 'Add Product'),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _viewProduct(Map<String, dynamic> p) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(p['name']),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (p['imageUrl'] != null)
              Center(child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.network(p['imageUrl'], height: 100, errorBuilder: (_, __, ___) => const SizedBox()),
              )),
            const SizedBox(height: 8),
            _row('Selling Price', '₹${p['sellingPrice']}'),
            _row('Status', p['isActive'] == true ? 'Active' : 'Inactive'),
          ],
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
      ),
    );
  }

  Widget _row(String l, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(children: [
      SizedBox(width: 100, child: Text(l, style: const TextStyle(color: Color(0xFF607D8B), fontSize: 13))),
      Text(v, style: const TextStyle(fontWeight: FontWeight.w600)),
    ]),
  );

  Future<void> _delete(Map<String, dynamic> product) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Remove Product'),
        content: Text('Deactivate "${product['name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Remove', style: TextStyle(color: Color(0xFFE53935)))),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ApiService.delete('/products/${product['id']}', token: _token);
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Products'), leading: IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer())),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab_products',
        onPressed: () => _showForm(),
        backgroundColor: const Color(0xFF0097A7),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _products.isEmpty
                  ? const Center(child: Text('No products found'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _products.length,
                      itemBuilder: (_, i) {
                        final p = _products[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: _productAvatar(p),
                            title: Text(p['name'], style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('₹${p['sellingPrice']}'),
                            trailing: PopupMenuButton<String>(
                              onSelected: (action) {
                                if (action == 'view') _viewProduct(Map<String, dynamic>.from(p));
                                if (action == 'edit') _showForm(product: Map<String, dynamic>.from(p));
                                if (action == 'delete') _delete(Map<String, dynamic>.from(p));
                              },
                              itemBuilder: (_) => [
                                const PopupMenuItem(value: 'view', child: Row(children: [Icon(Icons.visibility_outlined, size: 18), SizedBox(width: 8), Text('View')])),
                                const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit')])),
                                const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: Color(0xFFE53935)), SizedBox(width: 8), Text('Remove', style: TextStyle(color: Color(0xFFE53935)))])),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
