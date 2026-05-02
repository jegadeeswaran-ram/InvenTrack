const { z } = require('zod');

const loginSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const productSchema = z.object({
  name:          z.string().min(1, 'Name is required'),
  category:      z.string().min(1, 'Category is required'),
  sku:           z.string().min(1, 'SKU is required'),
  price:         z.coerce.number().min(0, 'Price must be >= 0'),
  costPrice:     z.coerce.number().min(0, 'Cost price must be >= 0'),
  unit:          z.enum(['PCS', 'BOX']).default('PCS'),
  openingStock:  z.coerce.number().int().min(0).default(0),
  minStockAlert: z.coerce.number().int().min(0).default(5),
  description:   z.string().optional(),
  isActive:      z.coerce.boolean().default(true),
});

const stockAdjustSchema = z.object({
  branchId:   z.coerce.number().int().positive(),
  productId:  z.coerce.number().int().positive(),
  adjustment: z.number().int().refine((n) => n !== 0, 'Adjustment cannot be zero'),
  reason:     z.string().min(1, 'Reason is required'),
});

const dispatchSchema = z.object({
  branchId:    z.number().int().positive(),
  truckId:     z.string().min(1, 'Truck ID is required'),
  userId:      z.number().int().positive(),
  sessionDate: z.string().min(1, 'Session date is required'),
  items: z
    .array(
      z.object({
        productId:   z.number().int().positive(),
        dispatchQty: z.number().int().min(1, 'Dispatch quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
});

const truckSaleSchema = z.object({
  sessionId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity:  z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
});

const shopSaleSchema = z.object({
  branchId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity:  z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0).optional(),
      })
    )
    .min(1, 'At least one item is required'),
});

const closingSubmitSchema = z.object({
  sessionId: z.number().int().positive(),
  returns: z
    .array(
      z.object({
        productId:       z.number().int().positive(),
        enteredReturnQty: z.number().int().min(0),
      })
    )
    .min(1, 'Return entries are required'),
});

const closingApproveSchema = z.object({
  adjustments: z
    .array(
      z.object({
        productId:        z.number().int().positive(),
        approvedReturnQty: z.number().int().min(0),
        reason:           z.string().optional(),
      })
    )
    .min(1, 'Adjustments are required'),
});

const expenseSchema = z.object({
  branchId:    z.number().int().positive(),
  category:    z.enum(['SALARY', 'INCENTIVE', 'ELECTRICITY', 'RENT', 'MISCELLANEOUS']),
  amount:      z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  expenseDate: z.string().min(1, 'Expense date is required'),
});

const userCreateSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email().optional().or(z.literal('')),
  mobile:   z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum(['ADMIN', 'BRANCH_MANAGER', 'SALESPERSON']),
  branchId: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

const userUpdateSchema = z.object({
  name:     z.string().min(1).optional(),
  email:    z.string().email().optional().or(z.literal('')),
  mobile:   z.string().optional(),
  password: z.string().min(6).optional().or(z.literal('')),
  role:     z.enum(['ADMIN', 'BRANCH_MANAGER', 'SALESPERSON']).optional(),
  branchId: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

const branchSchema = z.object({
  name:     z.string().min(1, 'Branch name is required'),
  address:  z.string().optional(),
  phone:    z.string().optional(),
  isActive: z.boolean().default(true),
});

const permissionsSchema = z.object({
  permissions: z.array(
    z.object({
      role:      z.enum(['BRANCH_MANAGER', 'SALESPERSON']),
      module:    z.string().min(1),
      canView:   z.boolean(),
      canCreate: z.boolean(),
      canEdit:   z.boolean(),
      canDelete: z.boolean(),
    })
  ),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const { Errors } = require('./errors');
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return next(Errors.VALIDATION_ERROR(messages, { fields: result.error.errors }));
  }
  req.body = result.data;
  next();
};

module.exports = {
  loginSchema, refreshSchema, logoutSchema,
  productSchema, stockAdjustSchema,
  dispatchSchema, truckSaleSchema, shopSaleSchema,
  closingSubmitSchema, closingApproveSchema,
  expenseSchema, userCreateSchema, userUpdateSchema,
  branchSchema, permissionsSchema,
  validate,
};
