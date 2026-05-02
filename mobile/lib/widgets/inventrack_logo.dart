import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class InvenTrackLogo extends StatelessWidget {
  final double width;
  final Color textColor;

  const InvenTrackLogo({super.key, this.width = 200, this.textColor = Colors.white});

  @override
  Widget build(BuildContext context) {
    final iconSize = width * 0.55;
    final fontSize = width * 0.13;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SvgPicture.asset('assets/images/logo_icon.svg', width: iconSize),
        const SizedBox(height: 8),
        RichText(
          text: TextSpan(
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w900,
              letterSpacing: 3,
              height: 1,
            ),
            children: [
              const TextSpan(text: 'IN', style: TextStyle(color: Color(0xFF0095DA))),
              TextSpan(text: 'TRACK', style: TextStyle(color: textColor)),
            ],
          ),
        ),
      ],
    );
  }
}
