import 'package:flutter/material.dart';
import '../shell_scope.dart';

class MediaScreen extends StatelessWidget {
  const MediaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Media'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => ShellScope.of(context)?.scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.photo_library_outlined, size: 64, color: cs.onSurface.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text('Media Library',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface)),
            const SizedBox(height: 8),
            Text('Media management is available on the web app.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.5), height: 1.5)),
          ]),
        ),
      ),
    );
  }
}
