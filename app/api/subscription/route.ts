import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSubscription, isEligibleForPremiumBonus } from '@/lib/subscription';

// Force cette route à être dynamique car elle utilise auth() qui dépend de headers()
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère l'abonnement de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getUserSubscription(userId);
    const eligibleForBonus = await isEligibleForPremiumBonus(userId);

    return NextResponse.json({
      subscription,
      eligibleForPremiumBonus: eligibleForBonus,
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
