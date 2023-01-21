import axios from "axios"

export interface AnnotationTarget{
    source: string
    selector: AnnotationSelector[]
}

export interface AnnotationSelector{
    type: string
    start?: number
    end?: number
    exact?: string
    prefix?: string
    suffix?: string
}

export interface Annotation {
    id: string,
    created: string,
    updated: string,
    uri: string,
    text: string,
    tags: string[],
    target: AnnotationTarget[]
    hidden: boolean
    flagged: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    user_info: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        display_name: string
    }
    links:{
        html: string,
        incontext: string,
        json: string
    }
}

interface HypothesisFetchOptions {
    user: string,
    sort?: string,
    tags?: string
}

export interface HypothesisResponse{
    total: number,
    rows: Annotation[]
}

export async function fetchAnnotationsForUser(params: HypothesisFetchOptions) {

    if(!params.sort){
        params.sort = "created";
    }

    console.log("params", params);

    return (await axios.get("https://hypothes.is/api/search", {params})).data as HypothesisResponse;
}
