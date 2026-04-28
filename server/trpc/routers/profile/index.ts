import { router, protectedProcedure } from '../../trpc';
import { createProfileHandler, deleteProfileHandler, getProfileHandler, updatePrefrencesHandler, listProfilesHandler } from './handler';
import { createProfileSchema, deleteProfileSchema, getProfileSchema, updatePrefrencesSchema } from './schema';

export const profileRouter = router({
  createProfile: protectedProcedure
    .input(createProfileSchema)
    .mutation(({input, ctx}) => createProfileHandler(input, ctx)),
  
  getProfile: protectedProcedure
    .input(getProfileSchema)
    .query(({input, ctx}) => getProfileHandler(input, ctx)),

  listProfiles: protectedProcedure
    .query(({ctx}) => listProfilesHandler(ctx)),

  updatePreferences: protectedProcedure
    .input(updatePrefrencesSchema)
    .mutation(({input, ctx}) => updatePrefrencesHandler(input, ctx)),

  deleteProfile: protectedProcedure
    .input(deleteProfileSchema)
    .mutation(({input, ctx}) => deleteProfileHandler(input, ctx))
});
