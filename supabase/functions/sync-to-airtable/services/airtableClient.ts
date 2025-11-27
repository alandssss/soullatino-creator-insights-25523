import {
    AirtableCreator,
    AirtableDailyMetric,
    AirtableRecord,
    AirtableListResponse,
    AirtableCreateResponse,
} from '../types.ts';

/**
 * Airtable Client
 * Handles all interactions with Airtable REST API
 * Includes retry logic, rate limiting, and error handling
 */
export class AirtableClient {
    private apiKey: string;
    private baseId: string;
    private creatorsTableId: string;
    private metricsTableId: string;
    private maxRetries: number;
    private baseDelay: number;

    constructor(
        apiKey: string,
        baseId: string,
        creatorsTableId: string,
        metricsTableId: string,
        maxRetries = 3,
        baseDelay = 1000
    ) {
        this.apiKey = apiKey;
        this.baseId = baseId;
        this.creatorsTableId = creatorsTableId;
        this.metricsTableId = metricsTableId;
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
    }

    /**
     * Ensure creator exists in Airtable, create if not
     * @returns Airtable record ID
     */
    async ensureCreatorExists(creator: {
        creator_id: string;
        username: string;
        email?: string | null;
        nivel_actual?: string | null;
        meta_dias_mes: number;
        meta_horas_mes: number;
    }): Promise<string> {
        console.log(`[AirtableClient] Ensuring creator exists: ${creator.creator_id}`);

        try {
            // First, try to find existing creator
            const existing = await this.findCreatorByCreatorId(creator.creator_id);

            if (existing) {
                console.log(`[AirtableClient] Creator found: ${existing.id}`);

                // Update creator info if needed
                await this.updateCreator(existing.id, creator);

                return existing.id;
            }

            // Creator doesn't exist, create new
            console.log(`[AirtableClient] Creating new creator: ${creator.creator_id}`);
            const newCreator = await this.createCreator(creator);

            console.log(`[AirtableClient] Creator created: ${newCreator.id}`);
            return newCreator.id;

        } catch (error) {
            console.error(`[AirtableClient] Error ensuring creator: ${creator.creator_id}`, error);
            throw error;
        }
    }

    /**
     * Find creator by creator_id
     */
    private async findCreatorByCreatorId(
        creatorId: string
    ): Promise<AirtableRecord<any> | null> {
        const formula = `{creator_id} = '${creatorId.replace(/'/g, "\\'")}'`;
        const url = `https://api.airtable.com/v0/${this.baseId}/${this.creatorsTableId}?filterByFormula=${encodeURIComponent(formula)}`;

        const response = await this.makeRequest<AirtableListResponse<any>>(url, 'GET');

        if (response.records && response.records.length > 0) {
            return response.records[0];
        }

        return null;
    }

    /**
     * Create new creator in Airtable
     */
    private async createCreator(creator: {
        creator_id: string;
        username: string;
        email?: string | null;
        nivel_actual?: string | null;
        meta_dias_mes: number;
        meta_horas_mes: number;
    }): Promise<AirtableCreateResponse<any>> {
        const url = `https://api.airtable.com/v0/${this.baseId}/${this.creatorsTableId}`;

        const payload = {
            fields: {
                creator_id: creator.creator_id,
                username: creator.username,
                ...(creator.email && { email: creator.email }),
                ...(creator.nivel_actual && { nivel_actual: creator.nivel_actual }),
                meta_dias_mes: creator.meta_dias_mes,
                meta_horas_mes: creator.meta_horas_mes,
            },
        };

        return await this.makeRequest<AirtableCreateResponse<any>>(
            url,
            'POST',
            payload
        );
    }

    /**
     * Update existing creator
     */
    private async updateCreator(
        recordId: string,
        creator: {
            username: string;
            email?: string | null;
            nivel_actual?: string | null;
            meta_dias_mes: number;
            meta_horas_mes: number;
        }
    ): Promise<void> {
        const url = `https://api.airtable.com/v0/${this.baseId}/${this.creatorsTableId}/${recordId}`;

        const payload = {
            fields: {
                username: creator.username,
                ...(creator.email && { email: creator.email }),
                ...(creator.nivel_actual && { nivel_actual: creator.nivel_actual }),
                meta_dias_mes: creator.meta_dias_mes,
                meta_horas_mes: creator.meta_horas_mes,
            },
        };

        await this.makeRequest(url, 'PATCH', payload);
    }

    /**
     * Upsert daily metric (create or update)
     */
    async upsertDailyMetric(
        creatorRecordId: string,
        metric: {
            fecha: string;
            diamonds_dia: number;
            live_hours_dia: number;
            new_followers_dia: number;
            hizo_live: number;
        }
    ): Promise<string> {
        console.log(`[AirtableClient] Upserting metric for ${metric.fecha}`);

        try {
            // Check if metric already exists
            const existing = await this.findDailyMetric(creatorRecordId, metric.fecha);

            if (existing) {
                console.log(`[AirtableClient] Updating existing metric: ${existing.id}`);
                await this.updateDailyMetric(existing.id, metric);
                return existing.id;
            }

            // Create new metric
            console.log(`[AirtableClient] Creating new metric for ${metric.fecha}`);
            const newMetric = await this.createDailyMetric(creatorRecordId, metric);

            console.log(`[AirtableClient] Metric created: ${newMetric.id}`);
            return newMetric.id;

        } catch (error) {
            console.error(`[AirtableClient] Error upserting metric:`, error);
            throw error;
        }
    }

    /**
     * Find daily metric by creator and date
     */
    private async findDailyMetric(
        creatorRecordId: string,
        fecha: string
    ): Promise<AirtableRecord<any> | null> {
        const formula = `AND(FIND('${creatorRecordId}', ARRAYJOIN({creator})), {fecha} = '${fecha}')`;
        const url = `https://api.airtable.com/v0/${this.baseId}/${this.metricsTableId}?filterByFormula=${encodeURIComponent(formula)}`;

        const response = await this.makeRequest<AirtableListResponse<any>>(url, 'GET');

        if (response.records && response.records.length > 0) {
            return response.records[0];
        }

        return null;
    }

    /**
     * Create new daily metric
     */
    private async createDailyMetric(
        creatorRecordId: string,
        metric: {
            fecha: string;
            diamonds_dia: number;
            live_hours_dia: number;
            new_followers_dia: number;
            hizo_live: number;
        }
    ): Promise<AirtableCreateResponse<any>> {
        const url = `https://api.airtable.com/v0/${this.baseId}/${this.metricsTableId}`;

        const payload = {
            fields: {
                creator: [creatorRecordId],
                fecha: metric.fecha,
                diamonds_dia: metric.diamonds_dia,
                live_hours_dia: metric.live_hours_dia,
                new_followers_dia: metric.new_followers_dia,
                hizo_live: metric.hizo_live,
            },
        };

        return await this.makeRequest<AirtableCreateResponse<any>>(
            url,
            'POST',
            payload
        );
    }

    /**
     * Update existing daily metric
     */
    private async updateDailyMetric(
        recordId: string,
        metric: {
            diamonds_dia: number;
            live_hours_dia: number;
            new_followers_dia: number;
            hizo_live: number;
        }
    ): Promise<void> {
        const url = `https://api.airtable.com/v0/${this.baseId}/${this.metricsTableId}/${recordId}`;

        const payload = {
            fields: {
                diamonds_dia: metric.diamonds_dia,
                live_hours_dia: metric.live_hours_dia,
                new_followers_dia: metric.new_followers_dia,
                hizo_live: metric.hizo_live,
            },
        };

        await this.makeRequest(url, 'PATCH', payload);
    }

    /**
     * Make HTTP request to Airtable with retry logic
     */
    private async makeRequest<T>(
        url: string,
        method: string,
        body?: any,
        retryCount = 0
    ): Promise<T> {
        try {
            const options: RequestInit = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);

            // Handle rate limiting (429)
            if (response.status === 429) {
                if (retryCount < this.maxRetries) {
                    const delay = this.baseDelay * Math.pow(2, retryCount);
                    console.warn(`[AirtableClient] Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);

                    await this.sleep(delay);
                    return this.makeRequest<T>(url, method, body, retryCount + 1);
                }
                throw new Error('Rate limit exceeded after max retries');
            }

            // Handle other errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[AirtableClient] HTTP ${response.status}: ${errorText}`);

                // Retry on server errors (5xx)
                if (response.status >= 500 && retryCount < this.maxRetries) {
                    const delay = this.baseDelay * Math.pow(2, retryCount);
                    console.warn(`[AirtableClient] Server error. Retrying in ${delay}ms`);

                    await this.sleep(delay);
                    return this.makeRequest<T>(url, method, body, retryCount + 1);
                }

                throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            if (retryCount < this.maxRetries && error instanceof TypeError) {
                // Network error, retry
                const delay = this.baseDelay * Math.pow(2, retryCount);
                console.warn(`[AirtableClient] Network error. Retrying in ${delay}ms`);

                await this.sleep(delay);
                return this.makeRequest<T>(url, method, body, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
