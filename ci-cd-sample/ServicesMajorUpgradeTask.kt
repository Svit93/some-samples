class ServicesMajorUpgradeTask {
    private val env = TestEnvironmentProvider.get()
    private val serviceInstanceClient =
        ServiceInstanceClient(basePath = env.bobForwardedBasePath, port = env.bobForwardedPort)
    private val keyVaultClient = KeyVaultSharedClient()
    private val bearerToken = keyVaultClient.getBearerToken("xxxToken")
    private val authClient by lazy { AuthenticationClient.forCloudAdmin() }

    @Test
    fun `major upgrade services`() {
        val cloudVersion = toMajorVersionNumber(authClient.getPeripheryVersion().version)

        val companyIdToMinVersionMap = serviceInstanceClient.getServicesPerCompany(bearerToken).servicesPerCompany.map {
            it.companyId to (it.services.map { service -> toMajorVersionNumber(service.version) }.min())
        }

        val companiesWithLowerVersion = companyIdToMinVersionMap.filter { it.second < cloudVersion }.map { it.first }
        println("There is ${companiesWithLowerVersion.size}/${companyIdToMinVersionMap.size} companies with not up-to-date version.")

        val companyErrors = mutableMapOf<Long, String>()
        companiesWithLowerVersion.forEach {
            val response = callMajorUpgrade(it)

            val error = response.thenTryExtractError()
            if (error != null) {
                companyErrors[it] = error.error
            }
        }

        if (companyErrors.isEmpty()) {
            return
        }

        println("There was ${companyErrors.size} error responses to company major upgrade.")
        companyErrors.forEach {
            println("${it.key} - ${it.value}")
        }
    }

    private fun toMajorVersionNumber(stringVersion: String): Long =
        stringVersion.replace(".", "").substring(0, 5).toLong()

    private fun callMajorUpgrade(companyId: Long): Response {
        return authClient.givenSessionHeaders()
            .body(ServiceUpgradeQueryDto(companyId))
            .post("${authClient.companyUrl}/api/query/Users/ServiceUpgradeQuery")
    }

    data class ServiceUpgradeQueryDto(
        @JsonProperty("TargetCompanyId") val targetCompanyId: Long,
    )
}
