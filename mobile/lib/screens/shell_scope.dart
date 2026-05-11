import 'package:flutter/material.dart';

/// Lets any descendant widget open the shell's drawer.
class ShellScope extends InheritedWidget {
  final GlobalKey<ScaffoldState> scaffoldKey;

  const ShellScope({super.key, required this.scaffoldKey, required super.child});

  static ShellScope? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShellScope>();

  @override
  bool updateShouldNotify(ShellScope old) => scaffoldKey != old.scaffoldKey;
}
