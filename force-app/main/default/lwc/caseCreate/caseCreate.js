import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// IMPORTANT: Replace with your actual Python API endpoint
const API_ENDPOINT = 'https://load-salesforce-data-to-neo-12557a8ff84f.herokuapp.com/semantic-search'; // e.g., 'https://my-python-solver.herokuapp.com/solve'

export default class CaseCreate extends LightningElement {
    @track problemDescription = '';
    @track isLoading = false;
    @track apiResponse = null;
    @track error = null;

    // Columns definition for the lightning-datatable
    articleColumns = [
        {
            label: 'Knowledge Article',
            fieldName: 'articleUrl',
            type: 'url',
            typeAttributes: { label: { fieldName: 'Id' }, target: '_blank' },
            tooltip: 'Click to open Knowledge Article'
        },
        { label: 'Summary', fieldName: 'summary', type: 'text', wrapText: true }
    ];

    handleProblemChange(event) {
        this.problemDescription = event.target.value;
    }

    async handleSubmit() {
        if (!this.problemDescription || this.problemDescription.trim() === '') {
            this.showToast('Error', 'Problem description cannot be empty.', 'error');
            return;
        }

        this.isLoading = true;
        this.apiResponse = null; // Clear previous response
        this.error = null; // Clear previous error

        try {
            // MODIFIED: Changed the payload key from 'description' to 'query'
            const payload = {
                query: this.problemDescription
            };

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any other headers your API might require, e.g., API keys
                    // 'Authorization': 'Bearer YOUR_API_KEY'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Try to get error message from API response body
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData && errorData.error) {
                         errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Ignore if response body is not JSON or empty
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            this.apiResponse = data;
            console.log('API Response:', JSON.stringify(data));

        } catch (error) {
            console.error('Error calling API:', error);
            this.error = error.message || 'An unexpected error occurred.';
            this.showToast('API Call Failed', this.error, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // Getter to format knowledge articles for the datatable
    get formattedKnowledgeArticles() {
        if (this.apiResponse && this.apiResponse.related_articles && this.apiResponse.related_articles.length > 0) {
            return this.apiResponse.related_articles.map(article => {
                return {
                    ...article, // Spread existing properties like Id and summary
                    // Construct the Salesforce Knowledge Article URL
                    // Assumes standard Knowledge object (Knowledge__kav)
                    // Adjust if you use a custom knowledge object
                    articleUrl: `/lightning/r/Knowledge__kav/${article.Id}/view`
                };
            });
        }
        return [];
    }

    get hasKnowledgeArticles() {
        return this.apiResponse && this.apiResponse.related_articles && this.apiResponse.related_articles.length > 0;
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}