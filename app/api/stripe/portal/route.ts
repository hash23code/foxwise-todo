import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPortalSession } from '@/lib/stripe';
import { getUserSubscription } from '@/lib/subscription';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

/**
 * Crée une session de portail Stripe pour gérer l'abonnement
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer l'abonnement de l'utilisateur
    const subscription = await getUserSubscription(userId);

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Créer la session de portail
    const portalSession = await createPortalSession(subscription.stripe_customer_id);

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
