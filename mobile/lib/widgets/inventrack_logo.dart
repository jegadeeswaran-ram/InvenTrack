import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class InvenTrackLogo extends StatelessWidget {
  final double width;
  final Color textColor;

  const InvenTrackLogo({super.key, required this.width, this.textColor = Colors.white});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final asset = textColor == Colors.white
        ? 'assets/images/logo_splash.svg'
        : (isDark ? 'assets/images/logo_dark_theme.svg' : 'assets/images/logo_light_theme.svg');

    return SvgPicture.asset(asset, width: width);
  }
}
