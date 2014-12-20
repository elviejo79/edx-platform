/**
 * Base view for the payment/verification flow.
 *
 * This view is responsible for the "progress steps"
 * at the top of the page, but it delegates
 * to subviews to render individual steps.
 *
 */
var edx = edx || {};

(function($, _, Backbone, gettext) {
    'use strict';

    edx.verify_student = edx.verify_student || {};

    edx.verify_student.PayAndVerifyView = Backbone.View.extend({
        el: '#pay-and-verify-container',

        template: '#progress-tpl',

        subviews: {},

        VERIFICATION_VIEW_NAMES: [
            'face-photo-step',
            'id-photo-step',
            'review-photos-step'
        ],

        initialize: function( obj ) {
            this.errorModel = obj.errorModel || {};
            this.displaySteps = obj.displaySteps || [];

            // Determine which step we're starting on
            // Depending on how the user enters the flow,
            // this could be anywhere in the sequence of steps.
            this.currentStepIndex = _.indexOf(
                _.pluck( this.displaySteps, 'name' ),
                obj.currentStep
            );

            this.progressView = new edx.verify_student.ProgressView({
                el: this.el,
                displaySteps: this.displaySteps,
                currentStepIndex: this.currentStepIndex
            });

            this.initializeStepViews( obj.stepInfo );
        },

        initializeStepViews: function( stepInfo ) {
            var i,
                stepName,
                stepData,
                subview,
                subviewConfig,
                nextStepTitle,
                subviewConstructors,
                verificationModel;

            // We need to initialize this here, because
            // outside of this method the subview classes
            // might not yet have been loaded.
            subviewConstructors = {
                'intro-step': edx.verify_student.IntroStepView,
                'make-payment-step': edx.verify_student.MakePaymentStepView,
                'payment-confirmation-step': edx.verify_student.PaymentConfirmationStepView,
                'face-photo-step': edx.verify_student.FacePhotoStepView,
                'id-photo-step': edx.verify_student.IDPhotoStepView,
                'review-photos-step': edx.verify_student.ReviewPhotosStepView,
                'enrollment-confirmation-step': edx.verify_student.EnrollmentConfirmationStepView
            };

            // Create the verification model, which is shared
            // among the different steps.  This allows
            // one step to save photos and another step
            // to submit them.
            verificationModel = new edx.verify_student.VerificationModel();

            for ( i = 0; i < this.displaySteps.length; i++ ) {
                stepName = this.displaySteps[i].name;
                subview = null;

                if ( i < this.displaySteps.length - 1) {
                    nextStepTitle = this.displaySteps[i + 1].title;
                } else {
                    nextStepTitle = "";
                }

                if ( subviewConstructors.hasOwnProperty( stepName ) ) {
                    stepData = {};

                    // Add any info specific to this step
                    if ( stepInfo.hasOwnProperty( stepName ) ) {
                        _.extend( stepData, stepInfo[ stepName ] );
                    }

                    subviewConfig = {
                        errorModel: this.errorModel,
                        templateName: this.displaySteps[i].templateName,
                        nextStepNum: (i + 2), // Next index, starting from 1
                        nextStepTitle: nextStepTitle,
                        stepData: stepData
                    };

                    // For photo verification steps, set the shared photo model
                    if ( this.VERIFICATION_VIEW_NAMES.indexOf(stepName) >= 0 ) {
                        _.extend( subviewConfig, { model: verificationModel } );
                    }

                    // Create the subview instance
                    // Note that we are NOT yet rendering the view,
                    // so this doesn't trigger GET requests or modify
                    // the DOM.
                    this.subviews[stepName] = new subviewConstructors[stepName]( subviewConfig );

                    // Listen for events to change the current step
                    this.listenTo( this.subviews[stepName], 'next-step', this.nextStep );
                    this.listenTo( this.subviews[stepName], 'go-to-step', this.goToStep );
                }
            }
        },

        render: function() {
            this.progressView.render();
            this.renderCurrentStep();
            return this;
        },

        renderCurrentStep: function() {
            var stepName, stepView, stepEl;

            // Get or create the step container
            stepEl = $("#current-step-container");
            if (!stepEl.length) {
                stepEl = $('<div id="current-step-container"></div>').appendTo(this.el);
            }

            // Render the subview
            // Note that this will trigger a GET request for the
            // underscore template.
            // When the view is rendered, it will overwrite the existing
            // step in the DOM.
            stepName = this.displaySteps[ this.currentStepIndex ].name;
            stepView = this.subviews[ stepName ];
            stepView.el = stepEl;
            stepView.render();
        },

        nextStep: function() {
            this.currentStepIndex = Math.min( this.currentStepIndex + 1, this.displaySteps.length - 1 );
            this.render();
        },

        goToStep: function( stepName ) {
            var stepIndex = _.indexOf(
                _.pluck( this.displaySteps, 'name' ),
                stepName
            );

            if ( stepIndex >= 0 ) {
                this.currentStepIndex = stepIndex;
                this.render();
            }
        },

    });

})(jQuery, _, Backbone, gettext);
