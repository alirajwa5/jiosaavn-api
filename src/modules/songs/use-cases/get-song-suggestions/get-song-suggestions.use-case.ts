import { HTTPException } from 'hono/http-exception'
import type { z } from 'zod'
import type { IUseCase } from '#common/types'
import type { SongModel, SongSuggestionAPIResponseModel } from '#modules/songs/models'
import { Endpoints } from '#common/constants'
import { useFetch } from '#common/helpers'
import { createSongPayload } from '#modules/songs/helpers'
import { CreateSongStationUseCase } from '#modules/songs/use-cases'

export interface GetSongSuggestionsArgs {
  songId: string
  limit: number
}

export class GetSongSuggestionsUseCase implements IUseCase<GetSongSuggestionsArgs, z.infer<typeof SongModel>[]> {
  private readonly createSongStation: CreateSongStationUseCase

  constructor() {
    this.createSongStation = new CreateSongStationUseCase()
  }

  async execute({ songId, limit }: GetSongSuggestionsArgs) {
    const stationId = await this.createSongStation.execute(songId)

    console.log({ stationId })
    const { data, ok } = await useFetch<z.infer<typeof SongSuggestionAPIResponseModel>>({
      endpoint: Endpoints.songs.suggestions,
      params: {
        stationid: stationId,
        k: limit
      },
      context: 'android'
    })

    console.log({ data })

    if (!data || !ok) {
      throw new HTTPException(404, { message: `no suggestions found for the given song` })
    }

    const { stationid, ...suggestions } = data

    return (
      Object.values(suggestions)
        .map((element) => element && createSongPayload(element.song))
        .filter(Boolean)
        .slice(0, limit) || []
    )
  }
}
