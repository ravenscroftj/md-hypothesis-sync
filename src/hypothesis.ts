/**
    Markdown/Hypothesis Sync Plugin for VSCode
    Copyright (C) 2023  James Ravenscroft

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import axios from "axios";

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
    },
    document:{
        title: string[]
    }
}

interface HypothesisFetchOptions {
    user: string,
    sort?: string,
    tags?: string,
    limit?: number,
    offset?: number
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

export async function fetchUserAnnotationCount(user: string) : Promise<number> {
    let response = await fetchAnnotationsForUser({user, limit:1});
    return response.total;
}