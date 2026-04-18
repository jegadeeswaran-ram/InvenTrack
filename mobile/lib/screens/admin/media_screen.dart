import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/app_drawer.dart';

class MediaScreen extends StatefulWidget {
  const MediaScreen({super.key});
  @override State<MediaScreen> createState() => _MediaScreenState();
}

class _MediaScreenState extends State<MediaScreen> with TickerProviderStateMixin {
  List<dynamic> _media = [];
  bool _loading = true;
  bool _uploading = false;
  late AnimationController _gridCtrl;

  String? get _token => context.read<AuthService>().token;

  @override
  void initState() {
    super.initState();
    _gridCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _load();
  }

  @override
  void dispose() {
    _gridCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService.get('/media', token: _token);
      setState(() { _media = data; _loading = false; });
      _gridCtrl.forward(from: 0);
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png'],
      allowMultiple: true,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    setState(() => _uploading = true);
    int uploaded = 0;
    int failed = 0;
    try {
      for (final file in result.files) {
        if (file.bytes == null) continue;
        try {
          await ApiService.uploadFile('/media/upload', file.bytes!, file.name, token: _token);
          uploaded++;
        } catch (_) { failed++; }
      }
      await _load();
      if (!mounted) return;
      final msg = failed > 0
          ? '$uploaded uploaded, $failed failed'
          : '$uploaded image${uploaded > 1 ? 's' : ''} uploaded!';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Row(children: [
          const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(msg),
        ]),
        backgroundColor: const Color(0xFF0097A7),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ));
    } finally {
      setState(() => _uploading = false);
    }
  }

  Future<void> _delete(String filename) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('Delete Image'),
      content: const Text('This image will be permanently removed.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
      ],
    ));
    if (ok != true) return;
    await ApiService.delete('/media/$filename', token: _token);
    _load();
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
  }

  String _displayName(String filename) {
    final parts = filename.split('_');
    return parts.length > 2 ? parts.sublist(2).join('_') : filename;
  }

  void _showDetails(dynamic m) {
    final cs = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      backgroundColor: cs.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(m['url'], height: 220, width: double.infinity, fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(height: 220, color: cs.onSurface.withValues(alpha: 0.06),
                child: Icon(Icons.broken_image_outlined, color: cs.onSurface.withValues(alpha: 0.3), size: 48))),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFF0097A7).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
              child: Text(_formatSize(m['size'] as int), style: const TextStyle(color: Color(0xFF0097A7), fontSize: 12, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(_displayName(m['filename']), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: cs.onSurface.withValues(alpha: 0.7)), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ]),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(10)),
            child: Row(children: [
              const Icon(Icons.link_rounded, size: 16, color: Color(0xFF0097A7)),
              const SizedBox(width: 8),
              Expanded(child: Text(m['url'], style: TextStyle(fontSize: 11, color: cs.onSurface.withValues(alpha: 0.6)), maxLines: 2, overflow: TextOverflow.ellipsis)),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: m['url']));
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: const Row(children: [Icon(Icons.copy, color: Colors.white, size: 16), SizedBox(width: 8), Text('URL copied!')]),
                    backgroundColor: const Color(0xFF0097A7),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    duration: const Duration(seconds: 2),
                  ));
                },
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: const Color(0xFF0097A7).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                  child: const Icon(Icons.copy_rounded, size: 16, color: Color(0xFF0097A7)),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 14),
          SizedBox(width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.delete_outline, color: Colors.red),
              label: const Text('Delete Image', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red), padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              onPressed: () { Navigator.pop(context); _delete(m['filename']); },
            ),
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = context.watch<ThemeNotifier>().isDark;
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Text('Media'),
        leading: Builder(builder: (ctx) => IconButton(icon: const Icon(Icons.menu_rounded), onPressed: () => Scaffold.of(ctx).openDrawer())),
        actions: [
          IconButton(icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined), onPressed: () => context.read<ThemeNotifier>().toggle()),
          IconButton(icon: const Icon(Icons.refresh_outlined), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _uploading ? null : _pickAndUpload,
        backgroundColor: const Color(0xFF0097A7),
        elevation: 4,
        icon: _uploading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.upload_rounded, color: Colors.white),
        label: Text(_uploading ? 'Uploading…' : 'Upload', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0097A7)))
          : RefreshIndicator(
              color: const Color(0xFF0097A7),
              onRefresh: _load,
              child: _media.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(
                        width: 100, height: 100,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0097A7).withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.photo_library_outlined, size: 48, color: const Color(0xFF0097A7).withValues(alpha: 0.5)),
                      ),
                      const SizedBox(height: 20),
                      Text('No images yet', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5), fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      Text('Tap Upload to add images', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.3), fontSize: 13)),
                    ]))
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 6,
                        mainAxisSpacing: 6,
                      ),
                      itemCount: _media.length,
                      itemBuilder: (_, i) {
                        final m = _media[i];
                        final delay = (i * 0.05).clamp(0.0, 0.6);
                        final anim = CurvedAnimation(
                          parent: _gridCtrl,
                          curve: Interval(delay, (delay + 0.4).clamp(0.0, 1.0), curve: Curves.easeOutBack),
                        );
                        return AnimatedBuilder(
                          animation: anim,
                          builder: (_, child) => Transform.scale(
                            scale: anim.value,
                            child: Opacity(opacity: anim.value.clamp(0.0, 1.0), child: child),
                          ),
                          child: GestureDetector(
                            onTap: () => _showDetails(m),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Stack(fit: StackFit.expand, children: [
                                Image.network(
                                  m['url'],
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    color: cs.onSurface.withValues(alpha: 0.06),
                                    child: Icon(Icons.broken_image_outlined, color: cs.onSurface.withValues(alpha: 0.3)),
                                  ),
                                ),
                                Positioned(
                                  top: 6, right: 6,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.35),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.open_in_full_rounded, color: Colors.white, size: 10),
                                  ),
                                ),
                              ]),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
