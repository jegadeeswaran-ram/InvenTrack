import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:kulfi_ice_inventrack/main.dart';
import 'package:kulfi_ice_inventrack/services/auth_service.dart';

void main() {
  testWidgets('KulfiICEApp builds and shows splash branding', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthService()),
          ChangeNotifierProvider(create: (_) => ThemeNotifier()),
        ],
        child: const KulfiICEApp(),
      ),
    );
    await tester.pump();
    expect(find.text('Kulfi ICE'), findsOneWidget);
  });
}
