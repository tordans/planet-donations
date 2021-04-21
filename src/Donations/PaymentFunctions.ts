import { postRequest, putAuthenticatedRequest } from '../Utils/api';
import {CreateDonationFunctionProps} from './../Common/Types/';

export function getPaymentProviderRequest(gateway, paymentSetup, paymentMethod){
  let payDonationData;
  if (gateway === 'stripe') {
    payDonationData = {
      paymentProviderRequest: {
        account: paymentSetup.gateways.stripe.account,
        gateway: 'stripe_pi',
        source: {
          id: paymentMethod.id,
          object: 'payment_method',
        },
      },
    };
  }
  else if (gateway === 'paypal') {
    payDonationData = {
      paymentProviderRequest: {
        account: paymentSetup.gateways.paypal.account,
        gateway: 'paypal',
        source: {
          ...paymentMethod
        },
      },
    };
  }
  else if (gateway === 'stripe_giropay') {
    payDonationData = {
      paymentProviderRequest: {
        account: paymentSetup.gateways.stripe.account,
        gateway: 'stripe_pi',
        source: {
          object: 'giropay'
        }
      }
    }
  }
  else if (gateway === 'stripe_sofort') {
    payDonationData = {
      paymentProviderRequest: {
        account: paymentSetup.gateways.stripe.account,
        gateway: 'stripe_pi',
        source: {
          object: 'sofort'
        }
      }
    }
  }
  return payDonationData;
}

export function getPaymentType(paymentType: String) {
  let paymentTypeUsed;
  switch (paymentType) {
    case 'CARD':
      paymentTypeUsed = 'Credit Card';
      break;
    case 'SEPA':
      paymentTypeUsed = 'SEPA Direct Debit';
      break;
    case 'GOOGLE_PAY':
      paymentTypeUsed = 'Google Pay';
      break;
    case 'APPLE_PAY':
      paymentTypeUsed = 'Apple Pay';
      break;
    case 'BROWSER':
      paymentTypeUsed = 'Browser';
      break;
    default:
      paymentTypeUsed = 'Credit Card';
  }
  return paymentTypeUsed;
}

export async function createDonationFunction({
  isTaxDeductible,
  country,
  projectDetails,
  treeCost,
  treeCount,
  currency,
  contactDetails,
  isGift,
  giftDetails,
  setIsPaymentProcessing,
  setPaymentError,
  setdonationID,
}: CreateDonationFunctionProps) {
  const taxDeductionCountry = isTaxDeductible ? country : null;
  const donationData = createDonationData({ projectDetails, treeCount, treeCost, currency, contactDetails, taxDeductionCountry, isGift, giftDetails })
  try {
    const donation = await postRequest('/app/donations',donationData);
    if (donation && donation.data) {
      if (donation.data.code === 400) {
        setIsPaymentProcessing(false);
        setPaymentError(donation.data.message);
      } else if (donation.data.code === 500) {
        setIsPaymentProcessing(false);
        setPaymentError('Something went wrong please try again soon!');
      } else if (donation.data.code === 503) {
        setIsPaymentProcessing(false);
        setPaymentError(
          'App is undergoing maintenance, please check status.plant-for-the-planet.org for details',
        );
      } else {
        setdonationID(donation.data.id)
        return donation.data;
      }
    }
  }
  catch (error) {
    setIsPaymentProcessing(false);
    setPaymentError(error.message);
  }
}

export function createDonationData({
  projectDetails,
  treeCount,
  treeCost,
  currency,
  contactDetails,
  taxDeductionCountry,
  isGift,
  giftDetails
}: any) {
  let donationData = {
    type: 'trees',
    project: projectDetails.id,
    treeCount,
    amount: Math.round((treeCost * treeCount + Number.EPSILON) * 100) / 100,
    currency,
    donor: { ...contactDetails },
  };
  if (taxDeductionCountry) {
    donationData = {
      ...donationData,
      taxDeductionCountry,
    };
  }

  if (isGift) {
    if (giftDetails.type === 'invitation') {
      donationData = {
        ...donationData,
        ...{
          gift: {
            type: 'invitation',
            recipientName: giftDetails.recipientName,
            recipientEmail: giftDetails.email,
            message: giftDetails.giftMessage,
          }
        },
      };
    } else if (giftDetails.type === 'direct') {
      donationData = {
        ...donationData,
        ...{
          gift: {
            type: 'direct',
            recipientTreecounter: giftDetails.recipientTreecounter,
            message: giftDetails.giftMessage,
          }
        },
      };
    } else if (giftDetails.type === 'bulk') {
      // for multiple receipients
    }
  }
  return donationData;
}

export async function payDonationFunction({
  gateway,
  paymentMethod,
  setIsPaymentProcessing,
  setPaymentError,
  t,
  paymentSetup,
  donationID,
  setdonationStep,
  contactDetails
}: any) {
  setIsPaymentProcessing(true);

  if (!paymentMethod) {
    setIsPaymentProcessing(false);
    setPaymentError(t('donate:noPaymentMethodError'));
    return;
  }
  let payDonationData = getPaymentProviderRequest(gateway,paymentSetup,paymentMethod);
  
  try {
    const paidDonation = await putAuthenticatedRequest(`/app/donations/${donationID}`,payDonationData);

    if (paidDonation) {
      if (paidDonation.code === 400 || paidDonation.code === 401) {
        setIsPaymentProcessing(false);
        setPaymentError(paidDonation.message);
        return;
      } if (paidDonation.code === 500) {
        setIsPaymentProcessing(false);
        setPaymentError('Something went wrong please try again soon!');
        return;
      } if (paidDonation.code === 503) {
        setIsPaymentProcessing(false);
        setPaymentError(
          'App is undergoing maintenance, please check status.plant-for-the-planet.org for details',
        );
        return;
      }
      if (paidDonation.status === 'failed') {
        setIsPaymentProcessing(false);
        setPaymentError(paidDonation.message);
      } else if (paidDonation.paymentStatus === 'success' || paidDonation.paymentStatus === 'pending') {
        setIsPaymentProcessing(false);
        setdonationStep(4);
        
        return paidDonation;
      } else if (paidDonation.status === 'action_required') {
        handleSCAPaymentFunction({
          gateway,
          paidDonation,
          paymentSetup,
          window,
          setIsPaymentProcessing,
          setPaymentError,
          donationID,
          setdonationStep,
          contactDetails
        })
      }
    }
  } catch (error) {
    setIsPaymentProcessing(false);
    setPaymentError(error.message);
  }
}

export async function handleSCAPaymentFunction({
  gateway,
  paidDonation,
  paymentSetup,
  window,
  setIsPaymentProcessing,
  setPaymentError,
  donationID,
  setdonationStep,
  contactDetails
}: any) {  
  const clientSecret = paidDonation.response.payment_intent_client_secret;
  const key = paymentSetup?.gateways?.stripe?.authorization.stripePublishableKey ? paymentSetup?.gateways?.stripe?.authorization.stripePublishableKey : paymentSetup?.gateways?.stripe?.stripePublishableKey;
  const stripe = window.Stripe(
    key,
    {
      stripeAccount: paidDonation.response.account,
    },
  );
  if (stripe) {
    if(gateway === 'stripe'){
      const SCAdonation = await stripe.handleCardAction(clientSecret);      
      if (SCAdonation) {
        if (SCAdonation.error) {
          setIsPaymentProcessing(false);
          setPaymentError(SCAdonation.error.message);
        } else {
          const payDonationData = {
            paymentProviderRequest: {
              account: paymentSetup.gateways.stripe.account,
              gateway: 'stripe_pi',
              source: {
                id: SCAdonation.paymentIntent.id,
                object: 'payment_intent',
              },
            },
          };
          const SCAPaidDonation = await putAuthenticatedRequest(`/app/donations/${donationID}`,payDonationData);
          if (SCAPaidDonation) {
            if (SCAPaidDonation.paymentStatus) {
              setIsPaymentProcessing(false);
              setdonationStep(4);
              return SCAPaidDonation;
            } else {
              setIsPaymentProcessing(false);
              setPaymentError(SCAPaidDonation.error ? SCAPaidDonation.error.message : SCAPaidDonation.message);
            }
          }
        }
      }
    }
    else if(gateway === 'stripe_giropay'){
      const {error, paymentIntent} = await stripe.confirmGiropayPayment(
        paidDonation.response.payment_intent_client_secret,
        {
          payment_method: {
            billing_details: {
              name: `${contactDetails.firstname} ${contactDetails.lastname}`,
              email:contactDetails.email,
              address:{
                city: contactDetails.city,
                country: contactDetails.country,
                line1: contactDetails.address,
                postal_code: contactDetails.zipCode,
              }
            }
          },
          return_url: `${process.env.NEXTAUTH_URL}/payment-status?donationID=${donationID}&paymentType=Giropay`,
        }
      );

      if (error) {
        setIsPaymentProcessing(false);
        setPaymentError(error);
      }
      else {
        return;
      }
    }

    else if(gateway === 'stripe_sofort'){
      const {error, paymentIntent} = await stripe.confirmSofortPayment(
        paidDonation.response.payment_intent_client_secret,
        {
          payment_method: {
            sofort: {
              country: contactDetails.country
            },
            billing_details: {
              name: `${contactDetails.firstname} ${contactDetails.lastname}`,
              email:contactDetails.email,
              address:{
                city: contactDetails.city,
                country: contactDetails.country,
                line1: contactDetails.address,
                postal_code: contactDetails.zipCode,
              }
            }
          },
          return_url: `${process.env.NEXTAUTH_URL}/payment-status?donationID=${donationID}&paymentType=Sofort`,
        }
      );

      if (error) {
        setIsPaymentProcessing(false);
        setPaymentError(error);
      }
      else {
        console.log('paymentIntent',paymentIntent)
      }
    }
    
  }
}