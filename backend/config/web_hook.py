import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from api.models import CoursePayment


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except Exception:
        return JsonResponse({"error": "Invalid signature"}, status=400)

    # Handle checkout success
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        payment_intent_id = session.get("payment_intent")

        try:
            payment = CoursePayment.objects.get(stripe_payment_intent=payment_intent_id)
        except CoursePayment.DoesNotExist:
            return JsonResponse({"ok": True})

        # Mark as paid
        payment.paid = True
        payment.save()

        # Enroll the student
        course = payment.course
        student = payment.student

        student.courses.add(course)
        student.institutions.add(course.institution)

    return JsonResponse({"ok": True})
