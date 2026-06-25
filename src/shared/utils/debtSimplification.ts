/**
 * Algoritmo de simplificación de deudas (Greedy Debt Simplification).
 *
 * Dado el balance neto de cada miembro de un grupo, calcula el conjunto
 * mínimo (o casi mínimo) de transacciones necesarias para saldar todas
 * las deudas dentro del grupo.
 *
 * Estrategia:
 * 1. Separar a los participantes en acreedores (balance > 0, les deben dinero)
 *    y deudores (balance < 0, deben dinero).
 * 2. En cada iteración, tomar al mayor deudor y al mayor acreedor.
 * 3. El deudor le paga al acreedor el mínimo entre lo que debe y lo que le deben.
 * 4. Repetir hasta que todos los balances queden en cero (dentro de un epsilon).
 *
 * Esta función es pura y testeable: no depende de I/O, fechas del sistema,
 * ni de ningún store externo.
 */

export interface Balance {
  userId: string;
  amount: number; // positivo = le deben (acreedor), negativo = debe (deudor)
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/** Número de decimales usados para montos monetarios. */
const CURRENCY_DECIMALS = 2;
/** Tolerancia para considerar un balance como "saldado" (evita errores de float). */
const EPSILON = 0.005;

/**
 * Redondea un monto monetario a 2 decimales evitando errores clásicos
 * de punto flotante (ej. 0.1 + 0.2 !== 0.3).
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 10 ** CURRENCY_DECIMALS) / 10 ** CURRENCY_DECIMALS;
}

/**
 * Calcula el balance neto de cada usuario dado un conjunto de gastos planos
 * (montos ya pagados/adeudados). Útil como entrada a `simplifyDebts`.
 *
 * `paidByUserId` -> cuánto pagó cada persona en total
 * `owedByUserId` -> cuánto le corresponde pagar a cada persona en total (sus splits)
 */
export function calculateNetBalances(
  paidByUserId: Record<string, number>,
  owedByUserId: Record<string, number>
): Balance[] {
  const userIds = new Set([...Object.keys(paidByUserId), ...Object.keys(owedByUserId)]);
  const balances: Balance[] = [];

  userIds.forEach((userId) => {
    const paid = paidByUserId[userId] ?? 0;
    const owed = owedByUserId[userId] ?? 0;
    balances.push({ userId, amount: roundCurrency(paid - owed) });
  });

  return balances;
}

/**
 * Simplifica las deudas de un grupo minimizando el número de transacciones
 * necesarias para saldar todos los balances.
 *
 * @param balances Balance neto de cada usuario. Positivo = acreedor, negativo = deudor.
 *                 La suma total de todos los balances debería ser ~0 (sistema cerrado).
 * @returns Lista de transferencias sugeridas (de quién a quién y cuánto).
 */
export function simplifyDebts(balances: Balance[]): Settlement[] {
  // Trabajamos sobre copias redondeadas para no mutar la entrada del caller.
  const working = balances
    .map((b) => ({ userId: b.userId, amount: roundCurrency(b.amount) }))
    .filter((b) => Math.abs(b.amount) > EPSILON);

  const settlements: Settlement[] = [];

  // Límite de seguridad: nunca debería iterar más que N veces para N personas
  // (cada iteración satura al menos a una persona), pero protegemos contra
  // bucles infinitos por datos inconsistentes (ej. balances que no suman 0).
  const maxIterations = working.length * working.length + working.length + 10;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations += 1;

    // Encontrar el mayor deudor (balance más negativo) y el mayor acreedor
    // (balance más positivo).
    let debtorIdx = -1;
    let creditorIdx = -1;

    working.forEach((b, idx) => {
      if (b.amount < -EPSILON) {
        if (debtorIdx === -1 || b.amount < working[debtorIdx].amount) {
          debtorIdx = idx;
        }
      }
      if (b.amount > EPSILON) {
        if (creditorIdx === -1 || b.amount > working[creditorIdx].amount) {
          creditorIdx = idx;
        }
      }
    });

    if (debtorIdx === -1 || creditorIdx === -1) {
      // Ya no quedan deudores o acreedores pendientes: todo saldado.
      break;
    }

    const debtor = working[debtorIdx];
    const creditor = working[creditorIdx];

    const amount = roundCurrency(Math.min(-debtor.amount, creditor.amount));

    if (amount <= EPSILON) {
      break;
    }

    settlements.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount,
    });

    debtor.amount = roundCurrency(debtor.amount + amount);
    creditor.amount = roundCurrency(creditor.amount - amount);
  }

  return settlements;
}

/**
 * Calcula los balances netos de un grupo a partir de su lista de gastos,
 * y luego los simplifica. Combina `calculateNetBalances` + `simplifyDebts`
 * para el caso de uso más común: "¿quién le debe a quién en este grupo?".
 */
export function computeGroupSettlements(
  expenses: Array<{
    paidBy: string;
    amount: number;
    splits: Array<{ userId: string; amount: number }>;
  }>
): Settlement[] {
  const paidByUserId: Record<string, number> = {};
  const owedByUserId: Record<string, number> = {};

  expenses.forEach((expense) => {
    paidByUserId[expense.paidBy] = roundCurrency(
      (paidByUserId[expense.paidBy] ?? 0) + expense.amount
    );

    expense.splits.forEach((split) => {
      owedByUserId[split.userId] = roundCurrency(
        (owedByUserId[split.userId] ?? 0) + split.amount
      );
    });
  });

  const balances = calculateNetBalances(paidByUserId, owedByUserId);
  return simplifyDebts(balances);
}
