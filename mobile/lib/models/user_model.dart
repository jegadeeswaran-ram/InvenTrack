class UserModel {
  final int id;
  final String name;
  final String role;
  final int? branchId;
  final String? branchName;
  final bool isActive;

  const UserModel({
    required this.id,
    required this.name,
    required this.role,
    this.branchId,
    this.branchName,
    required this.isActive,
  });

  factory UserModel.fromJson(Map<String, dynamic> j) => UserModel(
        id: j['id'],
        name: j['name'],
        role: j['role'],
        branchId: j['branchId'],
        branchName: j['branch']?['name'],
        isActive: j['isActive'] ?? true,
      );

  bool get isAdmin        => role == 'ADMIN';
  bool get isManager      => role == 'BRANCH_MANAGER';
  bool get isSalesperson  => role == 'SALESPERSON';
}
